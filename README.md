# choirless

Choirless is music recording platform for the web that allows choirs to record collaborative performances by each choir member recording their performance separately, singing along to a backing track. 

The Terraform provisions a static website and a simple API that allows recordings to be made. The recorded videos are stored in Object Storage, the meta data is in the Cloudflare KV store.

To process the videos into a full edit:

```sh
mkdir videos
cd videos
```

Create a script like this:

```sh
#!/bin/bash
export AWS_ACCESS_KEY_ID=xxxx
export AWS_SECRET_ACCESS_KEY=yyy
export AWS_DEFAULT_REGION=auto
export AWS_ENDPOINT_URL="https://ACCOUNTID.r2.cloudflarestorage.com"
aws s3 sync s3://choirless3-video-storage .
```

run it to sync your cloud videos locally.

Then in the scripts directory do:

```sh
npm install
node render <songid>
```
 
## API

### List

```sh
curl -X POST -H'Content-type:application/json' -H"apikey: $APIKEY" "https://$URL/api/list"
{"ok":true,"list":[{"id":"1767801944183","title":"Testy","numTracks":0,"ts":0},{"id":"1767801950583","title":"Testy 2","numTracks":0,"ts":0}]}
```

### Add

```sh
curl -X POST -H'Content-type:application/json' -H"apikey: $APIKEY" -d'{"title":"Testy","tracks":[]}' "https://$URL/api/add"
{"ok":true,"id":"1767801950583"}
```

### Get

```sh
curl -X POST -H'Content-type:application/json' -H"apikey: $APIKEY" -d'{"id":"1767801950583"}' "https://$URL/api/get"
{"ok":true,"doc":{"id":"1767801950583","title":"Testy 2","tracks":[],"ts":0}}
```

### Del

```sh
curl -X POST -H'Content-type:application/json' -H"apikey: $APIKEY" -d'{"id":"1767801950583"}' "https://$URL/api/del"
{"ok":true}
```

## Upload

```sh
curl -X POST  -H"apikey: $APIKEY" -T example.webm "https://$URL/api/vidput?key=example.webm"
{"storageClass":"Standard","customMetadata":{},"httpMetadata":{},"uploaded":"2026-01-12T11:37:05.223Z","checksums":{"md5":"f339c5d9c070adcf491732ec29604566"},"httpEtag":"\"f339c5d9c070adcf491732ec29604566\"","etag":"f339c5d9c070adcf491732ec29604566","size":901401,"version":"7e644e013091c67f2f6c6bf93127488c","key":"example.webm"}
```

## Download

```sh
curl "https://$URL/api/vidget?key=example.webm&apikey=$APIKEY" > test.webm
...
```
