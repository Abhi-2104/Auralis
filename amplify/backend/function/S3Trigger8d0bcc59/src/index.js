const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS SDK v3 clients
const s3Client = new S3Client();
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Hard-code the table name since we know it
const SONGS_TABLE = 'Songs-dev';

/**
 * Processes uploaded audio files for bucket: auralis-music-storage69e06-dev
 */
exports.handler = async (event) => {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));

    try {
        // Get the uploaded file details
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        // Skip processing if not an audio file or not in music folder
        if (!key.match(/\.(mp3|wav|ogg|flac|m4a)$/i) || 
    (!key.includes('/music/') && !key.includes('/public/music/'))) {
    console.log('Not a music file or not in music folder, skipping processing');
    return { status: 'skipped', key };
}

        console.log(`Processing audio file: ${key}`);

        // Try to get metadata from S3 object
        const headObjectParams = {
            Bucket: bucket,
            Key: key
        };
        
        const headObjectResponse = await s3Client.send(new HeadObjectCommand(headObjectParams));
        console.log('Object metadata:', headObjectResponse.Metadata);
        
        // Extract metadata if available
        let title, artist, album, genre;
        let customMetadata = {};
        
        if (headObjectResponse.Metadata) {
            // Check if we have our custom metadata
            if (headObjectResponse.Metadata.custommetadata) {
                try {
                    customMetadata = JSON.parse(headObjectResponse.Metadata.custommetadata);
                    console.log('Parsed custom metadata:', customMetadata);
                } catch (e) {
                    console.error('Error parsing custom metadata:', e);
                }
            }
            
            // Get metadata either from custom JSON or individual fields
            title = customMetadata.title || headObjectResponse.Metadata.title;
            artist = customMetadata.artist || headObjectResponse.Metadata.artist;
            album = customMetadata.album || headObjectResponse.Metadata.album;
            genre = customMetadata.genre || headObjectResponse.Metadata.genre;
        }
        
        // If metadata is missing, fall back to filename parsing
        if (!title || !artist) {
            console.log('Metadata incomplete, parsing from filename');
            const fileName = key.split('/').pop().replace(/\.(mp3|wav|ogg|flac|m4a)$/i, '');
            
            const timestampMatch = fileName.match(/^(\d+)-(.*)$/);
            if (timestampMatch && timestampMatch.length === 3) {
                title = title || timestampMatch[2].replace(/-/g, ' ');
            } else {
                const artistTitleMatch = fileName.match(/^(.*?)\s*-\s*(.*?)$/);
                if (artistTitleMatch && artistTitleMatch.length === 3) {
                    artist = artist || artistTitleMatch[1].trim();
                    title = title || artistTitleMatch[2].trim();
                } else {
                    title = title || fileName;
                }
            }
            
            artist = artist || 'Unknown Artist';
        }

        // Look for associated cover image
        let imageUrl = '';
        if (customMetadata.imageUrl) {
            imageUrl = customMetadata.imageUrl;
        }

        // Generate a unique song ID
        const songId = uuidv4();

        // Prepare song data with extracted info
        const songData = {
            id: songId,
            title: title || 'Unknown Title',
            artist: artist || 'Unknown Artist',
            album: album || 'Unknown Album',
            genre: genre || 'Uncategorized',
            duration: 0, // Currently can't extract duration reliably
            audioUrl: `s3://${bucket}/${key}`,
            imageUrl: imageUrl,
            createdAt: new Date().toISOString()
        };

        console.log('Prepared song data:', JSON.stringify(songData, null, 2));
        console.log(`Using DynamoDB table: ${SONGS_TABLE}`);
        
        // Store in DynamoDB using the known table name
        await docClient.send(new PutCommand({
            TableName: SONGS_TABLE,
            Item: songData
        }));

        console.log(`Successfully processed: ${songData.title} by ${songData.artist}`);

        return {
            status: 'success',
            songId: songId,
            key: key
        };
    } catch (error) {
        console.error('Error processing audio file:', error);
        console.error('Error stack:', error.stack);
        return {
            status: 'error',
            error: error.message,
            stack: error.stack
        };
    }
};