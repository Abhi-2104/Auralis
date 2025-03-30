// amplify/backend/function/registerUser/src/index.js
const { CognitoIdentityServiceProvider } = require('aws-sdk');
const cognito = new CognitoIdentityServiceProvider();

exports.handler = async (event) => {
    try {
        // This function extends the standard Cognito registration
        // We can use it to create additional user records in DynamoDB
        // or perform other post-registration actions
        
        // Parse user data from the request body
        const { email, username } = JSON.parse(event.body);
        
        // Example: Add custom attributes or perform additional actions
        // For now, just return success response
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            body: JSON.stringify({
                message: "Registration extension successful",
                username: username,
                email: email
            }),
        };
    } catch (error) {
        console.log('Error extending registration:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            body: JSON.stringify({
                message: "Failed to process registration extension",
                error: error.message
            }),
        };
    }
};