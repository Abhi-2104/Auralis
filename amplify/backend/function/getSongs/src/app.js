/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

/* Amplify Params - DO NOT EDIT
    API_AURALIS_GRAPHQLAPIIDOUTPUT
    API_AURALIS_PLAYLISTSONGSTABLE_ARN
    API_AURALIS_PLAYLISTSONGSTABLE_NAME
    API_AURALIS_PLAYLISTTABLE_ARN
    API_AURALIS_PLAYLISTTABLE_NAME
    API_AURALIS_SONGTABLE_ARN
    API_AURALIS_SONGTABLE_NAME
    API_AURALIS_USERTABLE_ARN
    API_AURALIS_USERTABLE_NAME
    AUTH_AURALISDE9FB2F9_USERPOOLID
    ENV
    REGION
    STORAGE_MUSICSTORAGE_BUCKETNAME
    STORAGE_SONGS_ARN
    STORAGE_SONGS_NAME
    STORAGE_SONGS_STREAMARN
Amplify Params - DO NOT EDIT */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const bodyParser = require('body-parser');
const express = require('express');

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Get table name with environment suffix
let tableName = "Songs";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

// Create Express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

/**
 * GET /songs
 * Get all songs with optional filtering and pagination
 */
app.get('/songs', async function(req, res) {
  console.log('GET /songs request received', req.query);
  
  try {
    // Get query parameters
    const { genre, artist, album, limit = '50', nextToken } = req.query;
    
    // Build scan parameters
    let params = {
      TableName: tableName,
      Limit: parseInt(limit)
    };
    
    // Add filters if provided
    let filterExpressions = [];
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};
    
    if (genre) {
      filterExpressions.push('#genre = :genre');
      expressionAttributeValues[':genre'] = genre;
      expressionAttributeNames['#genre'] = 'genre';
    }
    
    if (artist) {
      filterExpressions.push('#artist = :artist');
      expressionAttributeValues[':artist'] = artist;
      expressionAttributeNames['#artist'] = 'artist';
    }
    
    if (album) {
      filterExpressions.push('#album = :album');
      expressionAttributeValues[':album'] = album;
      expressionAttributeNames['#album'] = 'album';
    }
    
    // Add filter expression to params if filters exist
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeValues = expressionAttributeValues;
      params.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    // Add pagination token if provided
    if (nextToken) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }
    
    // Execute the scan
    const data = await ddbDocClient.send(new ScanCommand(params));
    
    // Prepare response
    const response = {
      songs: data.Items,
      count: data.Count
    };
    
    // Add pagination token if more results exist
    if (data.LastEvaluatedKey) {
      response.nextToken = Buffer.from(
        JSON.stringify(data.LastEvaluatedKey)
      ).toString('base64');
    }
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching songs:', err);
    res.status(500).json({
      error: 'Could not load songs',
      message: err.message
    });
  }
});

/**
 * GET /songs/{id}
 * Get a specific song by ID
 */
app.get('/songs/:id', async function(req, res) {
  console.log('GET /songs/:id request received', req.params);
  
  try {
    const songId = req.params.id;
    
    const params = {
      TableName: tableName,
      Key: { id: songId }
    };
    
    const data = await ddbDocClient.send(new GetCommand(params));
    
    if (data.Item) {
      res.json(data.Item);
    } else {
      res.status(404).json({
        error: 'Not found',
        message: `Song with ID ${songId} not found`
      });
    }
  } catch (err) {
    console.error('Error fetching song:', err);
    res.status(500).json({
      error: 'Could not load song',
      message: err.message
    });
  }
});

/**
 * GET /songs/popular
 * Get popular songs (most played)
 */
app.get('/songs/popular', async function(req, res) {
  console.log('GET /songs/popular request received');
  
  try {
    // For now, just return a random sample of songs
    // In a real app, you'd track play counts and sort by them
    const params = {
      TableName: tableName,
      Limit: 10
    };
    
    const data = await ddbDocClient.send(new ScanCommand(params));
    
    res.json({
      songs: data.Items,
      count: data.Count
    });
  } catch (err) {
    console.error('Error fetching popular songs:', err);
    res.status(500).json({
      error: 'Could not load popular songs',
      message: err.message
    });
  }
});

/**
 * GET /songs/by-genre/{genre}
 * Get songs by genre
 */
app.get('/songs/by-genre/:genre', async function(req, res) {
  console.log('GET /songs/by-genre/:genre request received', req.params);
  
  try {
    const genre = req.params.genre;
    const { limit = '50', nextToken } = req.query;
    
    const params = {
      TableName: tableName,
      FilterExpression: '#genre = :genre',
      ExpressionAttributeNames: {
        '#genre': 'genre'
      },
      ExpressionAttributeValues: {
        ':genre': genre
      },
      Limit: parseInt(limit)
    };
    
    // Add pagination token if provided
    if (nextToken) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }
    
    const data = await ddbDocClient.send(new ScanCommand(params));
    
    const response = {
      songs: data.Items,
      count: data.Count,
      genre
    };
    
    // Add pagination token if more results exist
    if (data.LastEvaluatedKey) {
      response.nextToken = Buffer.from(
        JSON.stringify(data.LastEvaluatedKey)
      ).toString('base64');
    }
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching songs by genre:', err);
    res.status(500).json({
      error: 'Could not load songs by genre',
      message: err.message
    });
  }
});

// Start the server
app.listen(3000, function() {
  console.log("App started");
});

// Export the app object
module.exports = app;