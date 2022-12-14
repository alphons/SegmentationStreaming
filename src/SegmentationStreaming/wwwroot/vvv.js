 // https://joshuatz.com/posts/2020/appending-videos-in-javascript-with-mediasource-buffers/

(async () =>
{
	var buffer;
	var queue = [];

	const video = document.getElementById('video');

	// Create a MediaSource instance and connect it to video element
	const mediaSource = new MediaSource();
	// This creates a URL that points to the media buffer,
	// and assigns it to the video element src
	video.src = URL.createObjectURL(mediaSource);

	mediaSource.addEventListener('sourceopen', function (e)
	{
		video.play();
		//avc1.42E01E,mp4a.40.2
		buffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
		buffer.mode = "sequence";
		buffer.addEventListener('updatestart', function (e) { console.log('updatestart: ' + mediaSource.readyState); });
		buffer.addEventListener('update', function (e) { console.log('update: ' + mediaSource.readyState); });
		buffer.addEventListener('updateend', function (e) { console.log('updateend: ' + mediaSource.readyState); });
		buffer.addEventListener('error', function (e)
		{
			console.log('error: ' + e.message + ' ' + mediaSource.readyState);
		});
		buffer.addEventListener('abort', function (e) { console.log('abort: ' + mediaSource.readyState); });

		buffer.addEventListener('update', function ()
		{
			if (queue.length > 0 && !buffer.updating)
			{
				buffer.appendBuffer(queue.shift());
			}
		});
	}, false);

	mediaSource.addEventListener('sourceopen', function (e) { console.log('sourceopen: ' + mediaSource.readyState); });
	mediaSource.addEventListener('sourceended', function (e) { console.log('sourceended: ' + mediaSource.readyState); });
	mediaSource.addEventListener('sourceclose', function (e) { console.log('sourceclose: ' + mediaSource.readyState); });
	mediaSource.addEventListener('error', function (e) { console.log('error: ' + mediaSource.readyState); });

	for (intI = 0; intI < 1; intI++)
	{
		var vidBlob = await (await fetch("Video/live21/" + intI)).blob();
		// We need array buffers to work with media source
		var vidBuff = await vidBlob.arrayBuffer();

		if (buffer.updating || queue.length > 0)
		{
			queue.push(vidBuff);
		} else
		{
			buffer.appendBuffer(vidBuff);
		}
	}
	
})();

