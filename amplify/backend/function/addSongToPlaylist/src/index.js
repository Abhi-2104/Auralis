// amplify/backend/function/addSongToPlaylist/src/index.js
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        console.log('🎵 addSongToPlaylist Lambda called with event:', JSON.stringify(event, null, 2));
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Get user from Cognito claims
        const userId = event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1];
        if (!userId) {
            return {
                statusCode: 401,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ message: "User not authenticated" }),
            };
        }
        
        // Parse request data
        const { playlistId, songId } = JSON.parse(event.body);
        
        // Validate required fields
        if (!playlistId || !songId) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ message: "Both playlistId and songId are required" }),
            };
        }
        
        // Verify playlist exists and belongs to user
        const playlistResponse = await docClient.get({
            TableName: process.env.STORAGE_PLAYLISTS_NAME,
            Key: { id: playlistId }
        }).promise();
        
        const playlist = playlistResponse.Item;
        if (!playlist) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ message: "Playlist not found" }),
            };
        }
        
        if (playlist.userID !== userId) {
            return {
                statusCode: 403,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ message: "You don't have permission to modify this playlist" }),
            };
        }
        
        // Verify song exists
        const songResponse = await docClient.get({
            TableName: process.env.STORAGE_SONGS_NAME,
            Key: { id: songId }
        }).promise();
        
        if (!songResponse.Item) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ message: "Song not found" }),
            };
        }
        
        // Check if song is already in playlist
        if (playlist.songs && playlist.songs.includes(songId)) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization"
                },
                body: JSON.stringify({ message: "Song already exists in this playlist" }),
            };
        }
        
        // Add song to playlist
        const timestamp = new Date().toISOString();
        await docClient.update({
            TableName: process.env.STORAGE_PLAYLISTS_NAME,
            Key: { id: playlistId },
            UpdateExpression: "SET songs = list_append(if_not_exists(songs, :empty_list), :song), updatedAt = :timestamp",
            ExpressionAttributeValues: {
                ":song": [songId],
                ":empty_list": [],
                ":timestamp": timestamp
            }
        }).promise();
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            body: JSON.stringify({ 
                message: "Song added to playlist successfully",
                playlistId,
                songId
            }),
        };
    } catch (error) {
        console.log('Error adding song to playlist:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            body: JSON.stringify({
                message: "Failed to add song to playlist",
                error: error.message
            }),
        };
    }
};