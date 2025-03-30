const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');
const mm = require('music-metadata');
const stream = require('stream');

/**
 * Processes uploaded audio files:
 * 1. Extract metadata (title, artist, album, duration)
 * 2. Update the Songs database table
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
        
        // Generate a unique song ID
        const songId = uuidv4();
        
        // Prepare song data
        const songData = {
            id: songId,
            title: metadata.common.title || key.split('/').pop().replace(/\.(mp3|wav|ogg|flac|m4a)$/i, ''),
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            genre: metadata.common.genre ? metadata.common.genre[0] : 'Uncategorized',
            duration: Math.round(metadata.format.duration || 0),
            audioUrl: `s3://${bucket}/${key}`,
            imageUrl: '',
            createdAt: new Date().toISOString()
        };
        
        // Store in DynamoDB
        await docClient.put({
            TableName: process.env.STORAGE_SONGS_NAME,
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