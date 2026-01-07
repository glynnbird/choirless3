# choirless

Choirless is music recording platform for the web that allows choirs to record collaborative performances by each choir member recording their performance separately, singing along to a backing track. 

## How it works (user perspective)

![screenshots](img/screenshot.png)

- A user signs up for Choirless with an email and password.
- Once logged in they can create a choir, become the defacto "leader" of that choir.
- Each choir can have any number of songs with song can have a number of named parts: e.g backing, baritone, tenor, alto & tenor.
- Each song's first recorded part is the "backing" part. It forms the time reference for all other parts and is normally recorded by the choir leader.
- Recording a part is matter of sitting infront of a laptop equipped with a camera and microphone. The web broweser captures the recorded video and audio and uploads it to the cloud for processing.
- The choir leader can then invite others to their choir; perhaps tens or hundreds of other people.
- Each invited member can contribute to any song in that choir, adding their rendition of one of the parts (alto, soprano etc).
- As each new rendition arrives, Choirless stitches each song's parts, whether there are three or three hundred, into a video a single wall with full stereo mix.
- The final video wall can be shared with the choir and beyond.

## How it works (technical perspective)

All of Choirless's technical works are contained in this repository. From a high level they are:

1. Terraform files - Terraform is an "infrastructure as code" tool, so each `.tf` file contains a description of the Amazon Web Service (AWS) infrastructure needed to create a Choirless deployment.
2. Lambda - Lambda is Amazon's serverless code engine. Choirless uses Lambda for two main tasks:
- API - to provide server-side API functions that insert, update and delete data using a DynamoDB database.
- Pipeline - the video stitching pipeline that produces the finished video code.
3. Front end - The website itself is a static, single-page web application built with Nuxt.js. It interacts with API Lambdas to get its data and reads and writes video files to AWS S3 object storage.

![top level overview](img/toplevel.png)

The following AWS services are used:

- IAM - for defining the roles that the Lambda functions adopt when executing and roles that the Choirless logged in users adopted after authentication.
- Cognito - AWS's user management system is used to keep track of users, authentication, password change, password reset etc. The front end interacts with Cognito through AWS's Amplify library.
- DynamoDB - the NoSQL database stores choirs, songs, song parts and each user's membership of each choir.
- Lambda - many serverless Node.js scripts are deployed to create an API for the front-end to call and to power the back end video stitching pipeline.
- S3 - object storage is used to storing uploaded video files, the finished video wall output and all other intermediate artefacts. Intermediate files are stored in buckets with a time-to=live, ensuring that data volume doesn't become excessive.
- Cloudwatch - for logging.
- EFS - the Elastic File Store is used to be mounted by certain Lambdas so that they have enough attached storage to keep intermediate video files during video processing.
- VPC - EFS requires that Lambdas and EFS run inside their own VPC.
