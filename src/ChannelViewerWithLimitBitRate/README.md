# View Channel

A simple example viewing a channel with setting and re-setting bitrate limit token using the Phenix WebSDK v2 APIs for channels.

## Run
1. Open our [hosted example](https://phenixrts.com/examples/ChannelViewerWithLimitBitRate).
2. (alternatively) Open index.html in a browser.
3. If you want to test it with your channel, just put your token as a query parameter to the browser url `?token=<your token here>`
4. The example app will set and reset bitrate automatically.
The default bitrate limit set to 500000, but you can overwrite it setting a query parameter to the browser url `?bitrateLimitInBitsPerSecond=<bitrateLimit you want to set>`.
Or using input under the video.


## Limitations:
* Browsers with webRTC support will view the channel in real-time. This includes the most recent versions of most popular browsers (Chrome, Firefox, Edge, Safari, Opera).

## More

* [Browsers' autoplay policies](https://phenixrts.com/docs/faq/index.html#why-isnt-autoplay-working)
* [Devices in battery saver mode](https://phenixrts.com/docs/faq/index.html#why-is-playback-blocked-in-battery-saver-mode)
* [Phenix Platform Documentation](http://phenixrts.com/docs/)
