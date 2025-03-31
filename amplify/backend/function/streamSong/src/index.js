/* Amplify Params - DO NOT EDIT
	API_AURALISAPI_APIID
	API_AURALISAPI_APINAME
	API_AURALIS_GRAPHQLAPIIDOUTPUT
	API_AURALIS_PLAYLISTSONGSTABLE_ARN
	API_AURALIS_PLAYLISTSONGSTABLE_NAME
	API_AURALIS_PLAYLISTTABLE_ARN
	API_AURALIS_PLAYLISTTABLE_NAME
	API_AURALIS_SONGTABLE_ARN
	API_AURALIS_SONGTABLE_NAME
	API_AURALIS_USERTABLE_ARN
	API_AURALIS_USERTABLE_NAME
	ENV
	REGION
	STORAGE_MUSICSTORAGE_BUCKETNAME
	STORAGE_PLAYLISTS_ARN
	STORAGE_PLAYLISTS_NAME
	STORAGE_PLAYLISTS_STREAMARN
	STORAGE_SONGS_ARN
	STORAGE_SONGS_NAME
	STORAGE_SONGS_STREAMARN
Amplify Params - DO NOT EDIT */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize clients with your region
const REGION = 'ap-south-1'; // Make sure this matches your project region
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: REGION });

// Define your table and bucket names
const SONGS_TABLE = 'Songs-dev'; // Update this if your table has a different name
const BUCKET_NAME = 'auralis-music-storage69e06-dev'; // Update this with your actual bucket name

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get the song ID from the path parameters
    const songId = event.pathParameters?.songId;
    
    if (!songId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({ error: 'Missing song ID' })
      };
    }
    
    console.log(`Getting song with ID: ${songId}`);
    
    // Get the song from DynamoDB
    const getItemCommand = new GetCommand({
      TableName: SONGS_TABLE,
      Key: { id: songId }
    });
    
    const result = await docClient.send(getItemCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({ error: 'Song not found' })
      };
    }
    
    // Get the S3 key from the song item
    const audioUrl = result.Item.audioUrl;
    console.log('Audio URL from DynamoDB:', audioUrl);
    
    if (!audioUrl || !audioUrl.startsWith('s3://')) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({ error: 'Song does not have a valid S3 URL', url: audioUrl })
      };
    }
    
    // Parse the S3 URL to get bucket and key
    const s3Path = audioUrl.replace('s3://', '');
    const [bucketName, ...keyParts] = s3Path.split('/');
    const key = keyParts.join('/');
    
    console.log(`Generating signed URL for bucket: ${bucketName}, key: ${key}`);
    
    // Generate a signed URL for the S3 object
    const command = new GetObjectCommand({
      Bucket: bucketName || BUCKET_NAME, // Use parsed bucket or default
      Key: key
    });
    
    // URL expiration time in seconds (15 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ signedUrl })
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        name: error.name
      })
    };
  }
};