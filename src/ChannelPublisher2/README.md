# Publish to a Channel using V2 SDK

A simple example publishing to channel using publish token.

## Run
1. Generate token for publish with Portal
   * In: Channel -> EdgeAuth -> Create Token
   * Link type: Publishing
   * Copy PublishToken
2. Open our [hosted example](https://phenixrts.com/examples/ChannelPublisher2) or (alternatively) open index.html in a browser.
3. Add token as query parameter to url `?token=<publishToken>`
4. Click on the `Publish` button


## Limitations:
* Publishing requires webRTC support. This is supported in the most recent versions of the popular browsers (Chrome, Firefox, Edge, Safari, Opera).
* Publishing requires a secure website (https).

## More
* [Phenix Platform Documentation](https://www.phenixrts.com/docs)