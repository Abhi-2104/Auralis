const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * Generates signed URLs for secure music streaming
 * for bucket: auralis-music-storage69e06-dev
 */
exports.handler = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Get song ID from request
        const songId = event.pathParameters?.id;
        if (!songId) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ error: 'Song ID is required' })
            };
        }
        
        // Get song info from DynamoDB
        const songData = await docClient.get({
            TableName: process.env.STORAGE_SONGS_NAME || 'Songs',
            Key: { id: songId }
        }).promise();
        
        if (!songData.Item) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ error: 'Song not found' })
            };
        }
        
        // Extract S3 path from the audioUrl
        const audioUrl = songData.Item.audioUrl;
        const s3Path = audioUrl.replace('s3://', '').split('/');
        const bucket = s3Path.shift();
        const key = s3Path.join('/');
        
        console.log(`Generating signed URL for bucket: ${bucket}, key: ${key}`);
        
        // Generate a signed URL (valid for 1 hour)
        let streamUrl;
        
        // If CloudFront is configured
        if (process.env.CLOUDFRONT_DOMAIN) {
            const cloudFront = new AWS.CloudFront.Signer(
                process.env.CLOUDFRONT_KEY_PAIR_ID,
                process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n')
            );
            
            const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
            streamUrl = cloudFront.getSignedUrl({
                url: cloudfrontUrl,
                expires: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
            });
            
            console.log(`Generated CloudFront signed URL`);
        } else {
            // Fallback to S3 signed URL
            streamUrl = s3.getSignedUrl('getObject', {
                Bucket: bucket,
                Key: key,
                Expires: 3600 // 1 hour
            });
            
            console.log(`Generated S3 signed URL`);
        }
        
        // Return the signed URL along with song details
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            body: JSON.stringify({
                songId: songId,
                title: songData.Item.title,
                artist: songData.Item.artist,
                album: songData.Item.album,
                streamUrl: streamUrl,
                duration: songData.Item.duration
            })
        };
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            body: JSON.stringify({ error: 'Failed to generate streaming URL' })
        };
    }
};