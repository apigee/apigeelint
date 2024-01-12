ORG=infinite-epoch-2900
PROXYNAME=dlp-example
REV=5
OUTDIR=$(mktemp -d /tmp/apigeelint-example.XXXXXX)
curl -s -H "Authorization: Bearer $TOKEN" -X GET \
    "https://apigee.googleapis.com/v1/organizations/$ORG/apis/$PROXYNAME/revisions/$REV?format=bundle" --output $OUTDIR/$PROXYNAME-$REV.zip
unzip $OUTDIR/$PROXYNAME-$REV.zip -d $OUTDIR/$PROXYNAME-$REV-unzipped
node ./cli.js -f table.js --profile apigeex -s $OUTDIR/$PROXYNAME-$REV-unzipped/apiproxy

rm -fr $OUTDIR
