const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB clients
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const tableName = 'Songs-dev';
    
    try {
      // Try to fetch real data from DynamoDB
      const command = new ScanCommand({
        TableName: tableName
      });
      
      console.log('Scanning table:', tableName);
      const response = await docClient.send(command);
      console.log(`Found ${response.Items?.length || 0} songs in DynamoDB`);
      
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({
          songs: response.Items || []
        })
      };
    } catch (dbError) {
      console.error('Error accessing DynamoDB:', dbError);
      
      // Return test data as fallback
      const testSongs = [
        {
          id: "test-song-1",
          title: "Test Song 1",
          artist: "Test Artist",
          album: "Test Album",
          duration: 180,
          genre: "Pop",
          audioUrl: "https://example.com/song1.mp3",
          imageUrl: "",
          createdAt: new Date().toISOString()
        },
        {
          id: "test-song-2",
          title: "Test Song 2",
          artist: "Another Artist",
          album: "Another Album",
          duration: 240,
          genre: "Rock",
          audioUrl: "https://example.com/song2.mp3", 
          imageUrl: "",
          createdAt: new Date().toISOString()
        }
      ];
      
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({
          songs: testSongs,
          note: "Test data - DynamoDB error: " + dbError.message
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};