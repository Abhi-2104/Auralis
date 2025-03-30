const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * Generates signed URLs for secure music streaming
 * for bucket: auralis-music-storage69e06-dev
 */
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event));
    
    try {
      const s3 = new AWS.S3();
      const docClient = new AWS.DynamoDB.DocumentClient();
      
      // Parse request body
      const body = event.body ? JSON.parse(event.body) : {};
      const songId = body.songId;
      
      if (!songId) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
          },
          body: JSON.stringify({ error: "Song ID is required" })
        };
      }
      
      // Get song details using the exact table name
      const tableName = 'Songs-dev';
      console.log(`Using DynamoDB table: ${tableName} to look up song ID: ${songId}`);
      
      const params = {
        TableName: tableName,
        Key: { id: songId }
      };
      
      const songData = await docClient.get(params).promise();
      console.log('Song data from DynamoDB:', JSON.stringify(songData));
      
      if (!songData.Item) {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
          },
          body: JSON.stringify({ error: "Song not found" })
        };
      }
      
      // Extract S3 path from audioUrl
      const audioUrl = songData.Item.audioUrl;
      console.log('Audio URL from database:', audioUrl);
      
      // Parse the S3 URL format
      let bucket, key;
      if (audioUrl.startsWith('s3://')) {
        const s3Path = audioUrl.replace('s3://', '').split('/');
        bucket = s3Path.shift();
        key = s3Path.join('/');
      } else {
        key = audioUrl;
        bucket = 'auralis-music-storage69e06-dev';
      }
      
      console.log(`Generating signed URL for bucket: ${bucket}, key: ${key}`);
      
      // Generate signed URL
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: bucket,
        Key: key,
        Expires: 3600 // URL expires in 1 hour
      });
      
      console.log('Generated signed URL successfully');
      
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({
          signedUrl: signedUrl
        }),
      };
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({ error: error.message }),
      };
    }
  };