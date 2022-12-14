# SegmentationStreaming
Smallest live-video streaming javascript implementation

## The Others

As of december 2022:

- hls.js 337kB
- dash.js 713kB
- SegPlayer.js 2kB


## Server

For making segments from a video/audio source the following ffmpeg command line can be used:

```
ffmpeg -re -i "..." -c copy -flags -global_header -hls_time 4 -hls_list_size 5 -master_pl_publish_rate 1 -hls_flags delete_segments -hls_segment_type fmp4 -hls_segment_filename "r:/KEY%d.m4s" -hls_fmp4_init_filename "KEY.mp4" "r:/KEY.m3u8"
```

When using mpeg source this produce segments of data which can be served bij a webserver.

The m3u8 file is a playlist showing the latest 5 segments. Earlier segments are automatically deleted. 

## SegPlayer.js

On the client side only the URL of the m3u8 file is used.

The script loads the m3u8 file and initaly searches for the init entry.

This init segment is fed to the media element on the webpage once.

After this, the script loads the m3u8 file on a regular basis (once every second) searches for new segments, if any, and these are also added to te media element.

When experiencing a 404 (not found), the script terminates.

The javascript is programmed asynchronous.

```javascript
'use strict';

var ms;
var sourceBuffer;

(async () =>
{
	await LoadVideoAsync("https://djpodium.com/live/segtest.m3u8");
})();

async function LoadVideoAsync(m3u8)
{
	ms = new MediaSource();
	ms.addEventListener('sourceopen', async function () { await PlayAsync(m3u8) }, false);

	document.getElementById("video").src = window.URL.createObjectURL(ms);
}

async function PlayAsync(m3u8)
{
	sourceBuffer = ms.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
	sourceBuffer.mode = "sequence";

	var baseUrl = m3u8.substring(0, m3u8.lastIndexOf("/") + 1);
	var initsegment = '';
	var archive = [];
	var queue = [];

	while (true)
	{
		var playlist = await (await fetch(m3u8)).text();
		if (playlist === 'StatusCode 404')
			break;

		var lines = playlist.split(/\r?\n/);

		lines.forEach(async function (line)
		{
			if (initsegment === '')
			{
				if (line.startsWith('#EXT-X-MAP:URI="'))
				{
					initsegment = baseUrl + line.substring(16, line.length - 1);
					var initBuffer = await (await fetch(initsegment)).arrayBuffer();
					sourceBuffer.appendBuffer(initBuffer);
					return;
				}
			}
			if (line.endsWith(".m4s"))
			{
				if (archive.indexOf(line) < 0)
				{
					archive.push(line);
					var segmentBuffer = await (await fetch(baseUrl + line)).arrayBuffer();
					queue.push(segmentBuffer);
				}
			}
		});

		while (sourceBuffer.updating === false && queue.length > 0)
			sourceBuffer.appendBuffer(queue.shift());

		while (archive.length > 10)
			archive.shift();

		await new Promise(r => setTimeout(r, 1000));
	}
}
```

Demo html page

```html
<!doctype html>
<html lang="en">
<head>
	<title>Just Testing de Segway</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta charset="utf-8" />

	<link href="SegPlayer.css" rel="stylesheet" />
	<script src="SegPlayer.js" defer></script>
</head>
<body>
	<div class="vid-container">
		<video id="video" autoplay="autoplay" muted controls></video>
	</div>
</body>
</html>
```

Demo CSS
```css
html
{
	box-sizing: border-box;
}

*, *:before, *:after
{
	box-sizing: inherit;
}

body
{
	background-color:black;
	padding: 0px;
	margin:0px;
	overflow-x: auto;
}

.vid-container
{
	position: absolute;
	top: 0;
	bottom: 0;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

	.vid-container video
	{
		min-width: 100%;
		min-height: 100%;

		max-width: 100%;
		max-height: 100%;

		width: auto;
		height: auto;

		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%,-50%);
	}

video::-webkit-media-controls-timeline
{
	display:none;
}

video::-webkit-media-controls-current-time-display
{
	display: none;
}

video::-webkit-media-controls-time-remaining-display
{
	display: none;
}
```
