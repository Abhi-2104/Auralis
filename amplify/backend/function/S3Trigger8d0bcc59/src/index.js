const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');
const mm = require('music-metadata');
const stream = require('stream');

/**
 * Processes uploaded audio files for bucket: auralis-music-storage69e06-dev
 */
exports.handler = async (event) => {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));
    
    try {
        // Get the uploaded file details
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        
        // Skip processing if not an audio file
        if (!key.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
            console.log('Not an audio file, skipping processing');
            return { status: 'skipped', key };
        }
        
        console.log(`Processing audio file: ${key}`);
        
        // Get the file from S3
        const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
        
        // Create readable stream from buffer
        const readableStream = new stream.PassThrough();
        readableStream.end(s3Object.Body);
        
        // Extract metadata using music-metadata
        const metadata = await mm.parseStream(readableStream, {
            mimeType: s3Object.ContentType,
            size: s3Object.ContentLength
        });
        
        // Extract filename without extension for title fallback
        const fileName = key.split('/').pop().replace(/\.(mp3|wav|ogg|flac|m4a)$/i, '');
        
        // Generate a unique song ID
        const songId = uuidv4();
        
        // Prepare song data with extracted metadata
        const songData = {
            id: songId,
            title: metadata.common.title || fileName,
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            genre: metadata.common.genre?.length ? metadata.common.genre[0] : 'Uncategorized',
            duration: Math.round(metadata.format.duration || 0),
            audioUrl: `s3://${bucket}/${key}`,
            imageUrl: '',  // Could extract embedded artwork if present
            createdAt: new Date().toISOString()
        };
        
        console.log('Extracted song data:', JSON.stringify(songData, null, 2));
        
        // Store in DynamoDB - make sure table name is correct
        await docClient.put({
            TableName: process.env.STORAGE_SONGS_NAME || 'Songs',
            Item: songData
        }).promise();
        
        console.log(`Successfully processed: ${songData.title} by ${songData.artist}`);
        
        return {
            status: 'success',
            songId: songId,
            key: key
        };
    } catch (error) {
        console.error('Error processing audio file:', error);
        return {
            status: 'error',
            error: error.message
        };
    }
};