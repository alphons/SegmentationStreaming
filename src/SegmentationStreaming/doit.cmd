
rem making dash files
c:\ffmpeg\ffmpeg -i "d:/videos/bbb_sunflower_1080p_30fps_normal.mp4" -map 0:0 -map 0:1 -c:a copy -c:v copy -bf 1 -keyint_min 120 -g 120 -sc_threshold 0 -b_strategy 0 -use_timeline 1 -use_template 1 -adaptation_sets "id=1,streams=v id=0,streams=a" -hls_playlist 1 -f dash "d:/videos/ex3/manifest.mpd"

rem making ts files
rem c:\ffmpeg\ffmpeg -i "d:/Videos/b.mp4" -c copy -flags -global_header -hls_time 4 -hls_list_size 500 -master_pl_publish_rate 1 -hls_flags delete_segments d:\Videos\ex\out.m3u8

rem making framgents of mp4
rem c:\ffmpeg\ffmpeg -i "d:/Videos/b.mp4" -c copy -map 0:0 -map 0:1 -segment_time 00:00:04 -f segment -reset_timestamps 1 "d:/Videos/ex2/out%d.mp4"
pause

rem Making fragments
c:\ffmpeg\ffmpeg -y -i ".." -map 0:0 -map 0:1 -c:v copy -c:a copy -force_key_frames "expr:gte(t,n_forced*2)" -sc_threshold 0 -hls_time 6 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "d:/videos/ex/v%d.m4s" "d:/videos/ex/prog_index.m3u8"

c:\ffmpeg\ffmpeg -y -i "d:/videos/bbb_sunflower_1080p_30fps_normal.mp4" -map 0:0 -map 0:1 -c:v libx264 -b:v 1500k -c:a aac -b:a 128k -force_key_frames "expr:gte(t,n_forced*2)" -sc_threshold 0 -hls_time 6 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "d:/videos/ex/v%d.m4s" "d:/videos/ex/prog_index.m3u8"


c:\ffmpeg\ffmpeg -y -i "d:/videos/bbb_sunflower_1080p_30fps_normal.mp4" -map 0:0 -map 0:1 -c:v libx264 -b:v 1500k -c:a aac -b:a 128k -force_key_frames "expr:gte(t,n_forced*2)" -sc_threshold 0 -movflags +frag_keyframe+faststart+empty_moov -hls_time 6 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "d:/videos/ex/v%d.m4s" "d:/videos/ex/prog_index.m3u8"



c:\ffmpeg\ffmpeg -y -i "d:/videos/a.mp4" -c:v copy -c:a copy -hls_time 4 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "d:/videos/ex/v%d.m4s" "d:/videos/ex/prog_index.m3u8"

