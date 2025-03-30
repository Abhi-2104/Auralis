const AWS = require('aws-sdk');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  
  try {
    const docClient = new AWS.DynamoDB.DocumentClient();
    
    // Use the exact table name we confirmed earlier
    const tableName = 'Songs-dev';
    console.log(`Using DynamoDB table: ${tableName}`);
    
    // Check for genre filter
    let params = {
      TableName: tableName
    };
    
    // Add genre filter if present in query parameters
    const genre = event.queryStringParameters && event.queryStringParameters.genre;
    if (genre && genre !== 'all') {
      console.log(`Filtering by genre: ${genre}`);
      params.FilterExpression = 'genre = :genre';
      params.ExpressionAttributeValues = {
        ':genre': genre
      };
    }
    
    console.log('DynamoDB Query Parameters:', JSON.stringify(params));
    const result = await docClient.scan(params).promise();
    console.log(`Found ${result.Items.length} songs in DynamoDB`);
    
    if (result.Items.length > 0) {
      console.log('First song sample:', JSON.stringify(result.Items[0]));
    } else {
      console.log('No songs found in the table');
    }
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        songs: result.Items
      }),
    };
  } catch (error) {
    console.error('Error fetching songs:', error);
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