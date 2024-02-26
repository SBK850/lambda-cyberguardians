import axios from 'axios';

export const handler = async (event) => {
    let { url } = JSON.parse(event.body); // Assuming the URL is passed in the event body

    try {
        if (!isValidUrl(url)) {
            return createResponse(400, { error: 'Invalid URL' });
        }

        // Replace 'view-post.html' with 'view-post-x.php' in the URL
        url = url.replace('view-post.html', 'view-post-x.php');

        // Fetch the data from the modified URL
        const response = await axios.get(url);
        const data = response.data; // This should be the JSON data you're interested in

        return createResponse(200, data); // Return the fetched data
    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { error: 'An unexpected error occurred' });
    }
};

function isValidUrl(string) {
    let url;
  
    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
}

function createResponse(statusCode, body) {
    return {
        isBase64Encoded: false,
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Add CORS header if needed
        },
        body: JSON.stringify(body),
    };
}
