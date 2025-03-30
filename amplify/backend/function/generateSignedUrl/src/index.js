const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const cloudFront = new AWS.CloudFront.Signer(
    process.env.CLOUDFRONT_KEY_PAIR_ID,
    process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n')
);

/**
 * Generates signed URLs for secure music streaming
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
                    "Access-Control-Allow-Headers": "*"
                },
                body: JSON.stringify({ error: 'Song ID is required' })
            };
        }
        
        // Get song info from DynamoDB
        const docClient = new AWS.DynamoDB.DocumentClient();
        const songData = await docClient.get({
            TableName: process.env.STORAGE_SONGS_NAME,
            Key: { id: songId }
        }).promise();
        
        if (!songData.Item) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                },
                body: JSON.stringify({ error: 'Song not found' })
            };
        }
        
        // Extract S3 path from the audioUrl
        const audioUrl = songData.Item.audioUrl;
        const s3Path = audioUrl.replace('s3://', '').split('/');
        const bucket = s3Path.shift();
        const key = s3Path.join('/');
        
        // Generate a signed URL (valid for 1 hour)
        let streamUrl;
        
        // If CloudFront is set up
        if (process.env.CLOUDFRONT_DOMAIN) {
            const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
            streamUrl = cloudFront.getSignedUrl({
                url: cloudfrontUrl,
                expires: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
            });
        } else {
            // Fallback to S3 signed URL if CloudFront is not set up
            streamUrl = s3.getSignedUrl('getObject', {
                Bucket: bucket,
                Key: key,
                Expires: 3600 // 1 hour
            });
        }
        
        // Return the signed URL
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                songId: songId,
                title: songData.Item.title,
                artist: songData.Item.artist,
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
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ error: 'Failed to generate streaming URL' })
        };
    }
};