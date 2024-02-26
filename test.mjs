import { handler } from './index.mjs';

// Replace with the URL you want to test with
const testUrl = 'https://youthvibe.000webhostapp.com/view-post.html?content=Just_walke-1708793131361';

// Sample event that mimics API Gateway event structure
const testEvent = {
    body: JSON.stringify({ url: testUrl }),
    // Include other properties that your Lambda function expects
};

handler(testEvent)
    .then(response => {
        // Parse the stringified response body to a JavaScript object
        const responseBody = JSON.parse(response.body);
        console.log('Response:', responseBody);
    })
    .catch(error => {
        console.error('Error:', error);
    });

