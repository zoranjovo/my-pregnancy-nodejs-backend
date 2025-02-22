[Front-End Repo](https://github.com/zoranjovo/my-pregnancy-react)

# Set Up for the Backend 
1. As below, you will be needing some information to parse into a config.json file created in the root directory of the project: `GitHub\my-pregnancy-nodejs-backend\`:

```json
{
    "mongoURL": "mongodb://ENTER_YOUR_MONGODB_URI",
    "JWTsecret": "SUPER_JWT_SECRET",
    "minioURL": "MINIO_URL",
    "minioUsr": "MINIO_USERNAME",
    "minioPwd": "SUPER_MINIO_PASSWORD"
}
```

**Please Note**: 
- Ensure you are changing the necessary fields about to apply to your own MongoDB.

# Backend Runtime 

1. Ensure steps within the [Set Up for the Backend](#set-up-for-the-backend) have been complete and the `config.json` is in the root directory of the project.
2. Run the following commands:
    - `npm install`, and when complete
    - `node .` to start it the backend.
3. A localhost URL should be displayed in the terminal if there are no errors, use this for the Frontend as the API/Backend endpoint address.




