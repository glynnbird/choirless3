# choirless

Choirless is music recording platform for the web that allows choirs to record collaborative performances by each choir member recording their performance separately, singing along to a backing track. 

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

