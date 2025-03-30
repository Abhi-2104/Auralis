const AWS = require('aws-sdk');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const docClient = new AWS.DynamoDB.DocumentClient();
    const tableName = 'Songs-dev';
    
    console.log(`Scanning table ${tableName}`);
    const result = await docClient.scan({
      TableName: tableName
    }).promise();
    
    console.log(`Found ${result.Items.length} songs`);
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        songs: result.Items || []
      })
    };
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