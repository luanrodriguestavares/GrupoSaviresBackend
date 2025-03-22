const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const spacesClient = new S3Client({
    region: process.env.DO_SPACES_REGION,
    endpoint: process.env.DO_SPACES_ENDPOINT,
    credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
        secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false
});

module.exports = spacesClient;