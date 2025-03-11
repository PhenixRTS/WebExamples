# Protected Channel View

This example demonstrates the Phenix WebSDK v2 `protectedchannels` module viewing a real-time DRM-protected stream.

**Prerequisites:**
* A valid Phenix account.
* A view token with the following capabilities:
    * `encoded-insertable-streams`
    * `iso-bmff-bitstream-media-source`
    * `drm-open-access`
* A browser that supports Widevine DRM (e.g., Chrome, Edge).

## Run

**Using the Hosted Example:**

For quick testing, you can use our hosted example:

* Open [https://phenixrts.com/examples/ProtectedChannelViewer2](https://phenixrts.com/examples/ProtectedChannelViewer2).
* Append your view token containing the required capabilities to the URL as a query parameter:
    * Example: `https://phenixrts.com/examples/ProtectedChannelViewer2?token=DIGEST:...`

**Local Setup (For Development):**

To run this example locally:

* Open `index.html` in your browser.
* Append your view token to the URL as a query parameter (as described above).

**Limitations (Current and Future DRM Support):**

* **Current Widevine Focus:** This example currently demonstrates Widevine DRM integration. While it is the sole DRM supported at this moment, the architecture is designed to accommodate future DRM providers.
* **Browser Compatibility:** Widevine is primarily supported on Chrome and Edge on desktop platforms. Mobile browser compatibility can vary. Browsers without Widevine support will not be able to play the protected content until support for their corresponding DRM system is implemented. When other DRM systems are added, the compatability list will be updated.

**More Information:**

* [Browsers' autoplay policies](https://phenixrts.com/docs/faq/index.html#why-isnt-autoplay-working)
* [Devices in battery saver mode](https://phenixrts.com/docs/faq/index.html#why-is-playback-blocked-in-battery-saver-mode)
* [Phenix Platform Documentation](http://phenixrts.com/docs/)