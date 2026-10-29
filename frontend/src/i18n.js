// 国际化多语言词条配置 (中 / 英文切换)
export const translations = {
  zh: {
    // 顶部导航
    app_title: "Instagram Tracker",
    nav_search_placeholder: "快速搜索博主并进入专属页...",
    status_ready: "凭证已就绪",
    status_offline: "未登录",
    nav_settings: "账号与设置",
    pwa_install_btn: "下载 App",
    pwa_installed_btn: "已安装微端",
    pwa_modal_title: "安装 Instagram Tracker 到手机桌面",
    lang_toggle_btn: "English",
    lang_toggle_title: "Switch to English",

    // 首页 / 博主广场
    home_hero_badge: "极简 Instagram 博主追踪平台",
    home_hero_title: "探索与追踪博主动态",
    home_hero_desc: "输入任意公开博主账号，一键自动保存 24 小时快拍（音视频无损合成），并按用户独立分类归档。",
    home_search_placeholder: "输入 Instagram 用户名 (如: xiaoskrren826 或 kohyingliew)...",
    home_search_btn: "进入博主页面",
    home_btn_view: "前往主页",
    home_btn_crawl_stories: "抓取快拍",
    home_btn_scanning: "正在执行任务...",
    home_tracked_title: "已收录博主",
    home_tracked_sub: "点击卡片即可查看快拍与变动",
    home_card_updated: "最近更新",
    home_card_archived: "本地已归档",
    home_pill_stories: "条 24h 快拍",
    home_pill_snapshots: "期名单快照",
    home_card_del_tip: "彻底删除 @{username} 的全部本地数据",
    home_card_avatar_tip: "点击预览并下载头像原图",
    home_empty_title: "暂无收录博主",
    home_empty_desc: "请在上方搜索框输入博主用户名，即可自动创建专属归档并开始抓取！",
    home_empty_btn: "立即体验抓取 @kohyingliew",

    // 0 基础极简指南
    guide_title: "简单三步，0 基础轻松上手",
    guide_sub: "无需了解任何底层抓取原理，一切复杂流程均在后台全自动处理",
    guide_step1_badge: "步骤 1",
    guide_step1_title: "输入博主账号",
    guide_step1_desc: "在搜索栏输入任意 Instagram 用户名或主页网址，系统将自动建立独立数据文件夹。",
    guide_step2_badge: "步骤 2",
    guide_step2_title: "一键下载快拍",
    guide_step2_desc: "点击【抓取 24h 快拍】，自动无损合成 DASH 视频与音乐，绝不出现卡死或静音视频。",
    guide_step3_badge: "步骤 3",
    guide_step3_title: "分屏查看变动",
    guide_step3_desc: "直观翻页查看关注与粉丝，所有专业级变动分析和原始 JSON 参数均独立收纳在详情页。",

    // 博主个人主页
    profile_back_btn: "返回博主广场",
    profile_avatar_tip: "点击预览并下载博主头像原图",
    profile_view_on_ig: "在 Instagram 查看",
    profile_del_btn: "删除该博主全部数据",
    profile_del_tip: "彻底删除该博主的所有快拍、关注与粉丝数据",
    profile_stat_stories_suffix: "条已存快拍 (永久归档)",
    profile_stat_following_suffix: "关注 (Following)",
    profile_stat_followers_suffix: "粉丝 (Followers)",
    profile_btn_crawling: "正在采集中...",
    profile_btn_crawl_stories: "🔥 抓取 24h 快拍",
    profile_btn_crawl_following: "👥 抓取关注名单",
    profile_btn_crawl_followers: "👥 抓取粉丝名单",
    profile_btn_verify_stats: "核验主页人数",
    profile_btn_refresh: "刷新数据",
    toast_refreshed: "已刷新当前博主数据",
    toast_verified_stats: "已同步 Instagram 官网实时显示人数",

    // 选项卡 Tabs
    tab_posts: "帖子",
    tab_stories: "24h 快拍",
    tab_highlights: "精选快拍",
    tab_reposts: "转帖",
    tab_tagged: "被标记",
    tab_following: "关注 (Following)",
    tab_followers: "粉丝 (Followers)",
    tab_details: "变动详情与对比",
    highlights_view_all_grouped: "全部精选 (按专辑分组)",
    view_all_albums_btn: "浏览所有专辑",
    nav_analysis_title: "数据变动与圈子分析",
    nav_analysis_desc: "粉丝变动对比 · 跨博主关系透视 · 共同好友",

    btn_crawl_all_media: "一键抓取全量媒体",
    btn_crawl_all_media_tip: "同时深度抓取官方帖子、精选快拍专辑、转帖与被他人标记内容",
    empty_posts: "暂无公开帖子，点击上方【一键抓取全量媒体】开始同步",
    empty_highlights: "该博主暂未设置精选快拍专辑",
    empty_reposts: "该博主主页暂无转帖记录",
    empty_tagged: "暂无他人标记此博主的帖子或 Reels",
    modal_post_likes: "次赞",
    modal_post_comments: "条评论",
    modal_post_download: "下载原画媒体",
    modal_post_download_music: "下载背景配乐",
    post_has_music: "附带背景音乐",
    sound_toggle_unmute: "播放配乐",
    sound_toggle_mute: "静音配乐",
    modal_tab_comments: "评论",
    modal_tab_likers: "点赞者",
    modal_refresh_interactions: "重新抓取评论与点赞",
    modal_likers_search_placeholder: "搜索点赞用户账号或昵称...",
    modal_likers_count_banner: "已收录 {fetched} 位点赞者 (官方记录总赞数: {total})",
    modal_comments_empty: "暂无公开评论",
    modal_likers_empty: "暂无点赞者名单",
    modal_view_on_ig: "在 Instagram 打开",
    modal_reply_count: "{count} 条回复",
    modal_hide_replies: "隐藏回复",
    modal_view_replies: "查看全部 {count} 条回复",
    reposted_from: "转发自",
    tagged_by: "来自",

    // 快拍 Tab
    stories_title: "24h 快拍收录",
    stories_resync: "重新同步",
    stories_syncing: "正在同步快拍...",
    stories_tag_video: "视频",
    stories_tag_image: "图片",
    stories_tag_reshared_story: "转发快拍",
    stories_tag_reshared_reel: "转发 Reels",
    stories_tag_reshared_post: "转发原帖",
    stories_reshared_story_by: "转发自快拍",
    stories_tag_bgm: "含背景音乐",
    stories_tag_archived: "历史归档",
    stories_mentions_label: "提及用户",
    stories_reshared_label: "转发原帖",
    stories_btn_play: "播放原画视频",
    stories_btn_view_img: "查看高清原图",
    stories_btn_download: "下载",
    stories_empty_title: "暂无进行中的 24h 快拍",
    stories_empty_desc: "该博主过去 24 小时未发布公开快拍，或快拍已过期。系统已完整保留本地历史媒体，无任何数据丢失。",

    // 关注/粉丝列表 Tab
    list_search_following: "在关注列表中快速搜索...",
    list_search_followers: "在粉丝列表中快速搜索...",
    list_snapshot_label: "快照版本:",
    list_crawl_new_btn: "立即抓取最新",
    list_export_btn: "导出 JSON",
    list_tag_story: "24h有快拍",
    list_tag_private: "私密账号",
    list_tag_verified: "官方认证",
    list_btn_visit_ig: "访问主页",
    list_pagination_per_page: "每页显示:",
    list_pagination_items: "条",
    list_pagination_info: "共 {total} 人，第 {page} / {totalPages} 页",
    list_pagination_prev: "上一页",
    list_pagination_next: "下一页",
    list_empty: "暂无数据，请先抓取快照。",

    // 详情分析与对比 Tab
    analysis_tab_history_diff: "单博主历史期数对比",
    analysis_tab_cross_network: "跨博主社交圈与关系分析",
    cross_user_a_label: "视角主博主 (User A)",
    cross_user_b_label: "对比目标博主/账号 (User B)",
    cross_user_c_label: "参考第三方博主 (User C - 可选)",
    cross_user_c_none: "不对比第三方博主",
    cross_custom_b_placeholder: "输入任意 Instagram 用户名...",
    cross_btn_analyze: "开始关系透视分析",
    cross_loading: "正在深度计算社交关系链路与圈子交集...",
    cross_direct_title: "直接双向关注诊断",
    cross_triad_title: "三方链路穿透关系",
    cross_insights_title: "智能社交关系洞察与发现",
    cross_tab_mutual_following: "共同关注",
    cross_tab_mutual_followers: "共同粉丝",
    cross_tab_a_only: "A 独有关注",
    cross_tab_b_only: "B 独有关注",
    cross_empty_mutual: "两位博主之间暂无此项重合名单",
    cross_overlap_rate: "圈子重合率",
    cross_custom_b_toggle: "手动输入任意用户名",
    cross_select_b_toggle: "从已收录博主中选择",

    diff_mode_following: "关注变动对比 (Following)",
    diff_mode_followers: "粉丝变动对比 (Followers)",
    diff_target_following: "目标关注期数 (新版):",
    diff_target_followers: "目标粉丝期数 (新版):",
    diff_base_following: "对比基准期数 (旧版):",
    diff_base_followers: "对比基准期数 (旧版):",
    diff_target_label: "当前快照:",
    diff_base_label: "对比基准:",
    diff_no_base: "不对比 (仅看单期快照)",
    diff_recalc_btn: "重新计算变动",
    diff_metric_total: "总人数",
    diff_metric_added: "新增关注 / 粉丝",
    diff_metric_removed: "取关 / 掉粉",
    diff_metric_stories: "24h 发过快拍",
    diff_filter_all: "全部",
    diff_filter_added: "新增关注",
    diff_filter_removed: "已经取关",
    diff_filter_story: "24h发快拍",
    diff_filter_private: "私密账号",
    diff_search_placeholder: "搜索用户昵称、账号或全名...",
    diff_col_user: "用户",
    diff_col_status: "变动状态",
    diff_col_story: "快拍状态",
    diff_col_private: "私密",
    diff_col_avatar: "头像变动",
    diff_col_actions: "操作",
    diff_status_added: "新增",
    diff_status_removed: "已取关",
    diff_status_retained: "保持",
    diff_private_yes: "私密",
    diff_private_no: "公开",
    diff_avatar_changed: "头像有更新",
    diff_avatar_same: "无变动",

    // 模态框: 通用设置与系统管理
    modal_settings_title: "通用设置与偏好 (General Settings)",
    modal_settings_tab_appearance: "显示与排版",
    modal_settings_tab_preferences: "通用偏好",
    modal_settings_tab_account: "账号与凭证",
    modal_settings_tab_storage: "数据与维护",

    settings_density_title: "列表显示密度与元素尺寸",
    settings_density_desc: "自由调节关注与粉丝列表中头像大小与文字尺寸，获得最舒适的阅读体验。",
    settings_density_compact: "紧凑模式",
    settings_density_compact_sub: "38px 头像 · 13px 字体",
    settings_density_comfortable: "舒适标准 (推荐放大)",
    settings_density_comfortable_sub: "50px 放大头像 · 14.5px 字体",
    settings_density_large: "大号清晰",
    settings_density_large_sub: "60px 超大头像 · 16.5px 字体",

    settings_stories_size_title: "快拍画廊排版尺寸",
    settings_stories_size_desc: "控制快拍卡片在不同屏幕下的显示宽度与列数。",
    settings_stories_standard: "标准四列 (260px)",
    settings_stories_large: "大画幅三列 (320px)",

    settings_time_format_title: "全局时间显示制式",
    settings_time_format_desc: "选择界面所有时间戳采用 12 小时制 (AM/PM) 或 24 小时制。",
    settings_time_12h: "12 小时制 (就 AM / PM)",
    settings_time_24h: "24 小时制 (00:00 - 23:59)",

    settings_page_size_title: "关注与粉丝列表默认分页",
    settings_page_size_desc: "首次进入博主主页时，关注与粉丝单页默认加载的用户数量。",
    settings_page_25: "每页 25 人",
    settings_page_50: "每页 50 人 (标准)",
    settings_page_100: "每页 100 人 (大容量)",

    settings_analysis_default_title: "变动分析默认起始页",
    settings_analysis_default_desc: "进入数据分析 Tab 时，默认优先展示的对比维度。",
    settings_analysis_following: "优先对比关注变动 (Following)",
    settings_analysis_followers: "优先对比粉丝变动 (Followers)",

    settings_storage_title: "本地存储状态与系统维护",
    settings_storage_desc: "查看本地收录博主与媒体数据统计，或重置前端显示偏好。",
    settings_stat_creators: "已收录博主总数",
    settings_stat_stories: "已归档快拍总数",
    settings_stat_snapshots: "历史快照期数",
    settings_reset_btn: "恢复前端全部默认设置",
    settings_reset_confirm: "确定要重置所有显示与偏好设置吗？",

    modal_settings_cookie_sec: "Instagram 登录凭证 (Cookie)",
    modal_settings_ready: "已配置",
    modal_settings_unready: "未配置",
    modal_settings_cookie_tip: "用于爬取 Instagram 公开博主快拍与列表。凭证仅保存在您本地设备。",
    modal_settings_auto_login: "弹出内置浏览器一键登录",
    modal_settings_manual_title: "手动粘贴 Cookie 字符串",
    modal_settings_manual_placeholder: "粘贴含有 sessionid 与 ds_user_id 的完整 Cookie 字符串...",
    modal_settings_save_cookie: "保存 Cookie",
    modal_settings_saved_success: "Cookie 保存成功！",
    modal_settings_logs_sec: "实时抓取日志与终端输出",
    modal_settings_show_logs: "展开终端日志",
    modal_settings_hide_logs: "隐藏终端日志",
    modal_settings_clear_logs: "清空日志",

    // 模态框: 删除博主数据
    modal_delete_title: "确认删除博主全部数据？",
    modal_delete_desc: "确定要彻底删除博主 @{username} 的所有归档数据吗？包括已下载的快拍视频、照片、粉丝与关注历史快照。此操作不可撤销。",
    modal_delete_cancel: "取消",
    modal_delete_confirm: "彻底删除",
    modal_delete_success: "博主数据已彻底删除！",

    // 模态框: 头像大图预览与下载
    modal_avatar_title: "博主头像原图",
    modal_avatar_download: "下载头像原图",
    modal_avatar_open_tab: "在新标签页打开",

    // 模态框: 媒体播放与原画
    modal_media_video_title: "快拍视频播放",
    modal_media_img_title: "快拍原图预览",

    // 任务运行中提示
    task_running_toast: "正在抓取中...",
    task_completed_toast: "任务已完成！",
    task_error_toast: "任务执行异常",
  },

  en: {
    // Top Navbar
    app_title: "Instagram Tracker",
    nav_search_placeholder: "Search creator and jump to profile...",
    status_ready: "Cookie Ready",
    status_offline: "Not Logged In",
    nav_settings: "Settings",
    pwa_install_btn: "Install App",
    pwa_installed_btn: "Installed",
    pwa_modal_title: "Install Instagram Tracker to Home Screen",
    lang_toggle_btn: "中文",
    lang_toggle_title: "切换为中文",

    // Home / Creator Square
    home_hero_badge: "Minimalist Instagram Tracker",
    home_hero_title: "Explore & Track Creators",
    home_hero_desc: "Enter any public Instagram account to archive 24h stories (lossless audio/video merge) and organize data in user folders.",
    home_search_placeholder: "Enter Instagram username (e.g., xiaoskrren826 or kohyingliew)...",
    home_search_btn: "Go to Creator",
    home_btn_view: "View Profile",
    home_btn_crawl_stories: "Crawl Stories",
    home_btn_scanning: "Processing...",
    home_tracked_title: "Tracked Creators",
    home_tracked_sub: "Click card to view stories and tracking history",
    home_card_updated: "Updated",
    home_card_archived: "Archived Locally",
    home_pill_stories: "24h Stories",
    home_pill_snapshots: "Snapshots",
    home_card_del_tip: "Permanently delete all local data for @{username}",
    home_card_avatar_tip: "Click to preview and download HD avatar",
    home_empty_title: "No Tracked Creators Yet",
    home_empty_desc: "Type an Instagram username above to create a folder and start tracking!",
    home_empty_btn: "Try Tracking @kohyingliew Now",

    // 3-Step Beginner Guide
    guide_title: "Get Started in 3 Simple Steps",
    guide_sub: "No technical knowledge required — everything is handled automatically in the background",
    guide_step1_badge: "Step 1",
    guide_step1_title: "Enter Creator Username",
    guide_step1_desc: "Type any Instagram username or URL; the system creates a dedicated data folder automatically.",
    guide_step2_badge: "Step 2",
    guide_step2_title: "One-Click Story Download",
    guide_step2_desc: "Click 'Crawl 24h Stories' to automatically merge DASH video and audio without any sync issues or muted videos.",
    guide_step3_badge: "Step 3",
    guide_step3_title: "Track Changes with Ease",
    guide_step3_desc: "Browse following and followers with clean pagination. Advanced diff analysis and raw data are neatly organized in the details tab.",

    // Creator Profile
    profile_back_btn: "Back to Creators",
    profile_avatar_tip: "Click to preview and download HD avatar",
    profile_view_on_ig: "View on Instagram",
    profile_del_btn: "Delete Creator Data",
    profile_del_tip: "Permanently delete all stories, following, and followers data for this creator",
    profile_stat_stories_suffix: "Saved Stories (Archived)",
    profile_stat_following_suffix: "Following",
    profile_stat_followers_suffix: "Followers",
    profile_btn_crawling: "Collecting...",
    profile_btn_crawl_stories: "🔥 Crawl 24h Stories",
    profile_btn_crawl_following: "👥 Crawl Following",
    profile_btn_crawl_followers: "👥 Crawl Followers",
    profile_btn_verify_stats: "Verify IG Stats",
    profile_btn_refresh: "Refresh Data",
    toast_refreshed: "Creator data refreshed",
    toast_verified_stats: "Verified live stats from Instagram",

    // Tabs
    tab_posts: "POSTS",
    tab_stories: "STORIES",
    tab_highlights: "HIGHLIGHTS",
    tab_reposts: "REPOSTS",
    tab_tagged: "TAGGED",
    tab_following: "FOLLOWING",
    tab_followers: "FOLLOWERS",
    tab_details: "ANALYSIS",
    highlights_view_all_grouped: "All Albums (Grouped)",
    view_all_albums_btn: "Browse All Albums",
    nav_analysis_title: "Social & Growth Analysis",
    nav_analysis_desc: "Follower diffs, mutuals & cross-user network",

    btn_crawl_all_media: "Crawl All Media",
    btn_crawl_all_media_tip: "Fetch Posts, Highlights, Reposts, and Tagged in one run",
    empty_posts: "No public posts yet. Click 'Crawl All Media' to sync.",
    empty_highlights: "No highlights created by this creator",
    empty_reposts: "No reposts on this creator's profile",
    empty_tagged: "No tagged posts or reels found",
    modal_post_likes: "likes",
    modal_post_comments: "comments",
    modal_post_download: "Download Media",
    modal_post_download_music: "Download Audio",
    post_has_music: "Original Audio",
    sound_toggle_unmute: "Play Audio",
    sound_toggle_mute: "Mute Audio",
    modal_tab_comments: "Comments",
    modal_tab_likers: "Likers",
    modal_refresh_interactions: "Refresh Comments & Likers",
    modal_likers_search_placeholder: "Search likers by username or name...",
    modal_likers_count_banner: "Fetched {fetched} likers (Total reported: {total})",
    modal_comments_empty: "No comments yet",
    modal_likers_empty: "No likers data found",
    modal_view_on_ig: "View on Instagram",
    modal_reply_count: "{count} replies",
    modal_hide_replies: "Hide replies",
    modal_view_replies: "View all {count} replies",
    reposted_from: "Reposted from",
    tagged_by: "Tagged by",

    // Stories Tab
    stories_title: "24h Stories",
    stories_resync: "Resync Stories",
    stories_syncing: "Syncing stories...",
    stories_tag_video: "Video",
    stories_tag_image: "Image",
    stories_tag_reshared_story: "Reshared Story",
    stories_tag_reshared_reel: "Reshared Reel",
    stories_tag_reshared_post: "Reshared Post",
    stories_reshared_story_by: "Reshared from",
    stories_tag_bgm: "With BGM",
    stories_tag_archived: "Archived",
    stories_mentions_label: "Mentions",
    stories_reshared_label: "Reshared post",
    stories_btn_play: "Play Video",
    stories_btn_view_img: "View Image",
    stories_btn_download: "Download",
    stories_empty_title: "No Active 24h Stories",
    stories_empty_desc: "This creator has no public stories posted in the past 24 hours, or stories have expired. All previously archived media are preserved locally.",

    // Following / Followers Tabs
    list_search_following: "Search following list...",
    list_search_followers: "Search followers list...",
    list_snapshot_label: "Snapshot:",
    list_crawl_new_btn: "Crawl Latest",
    list_export_btn: "Export JSON",
    list_tag_story: "Has 24h Story",
    list_tag_private: "Private",
    list_tag_verified: "Verified",
    list_btn_visit_ig: "Visit IG",
    list_pagination_per_page: "Per page:",
    list_pagination_items: "items",
    list_pagination_info: "{total} users, Page {page} of {totalPages}",
    list_pagination_prev: "Prev",
    list_pagination_next: "Next",
    list_empty: "No data available. Please crawl a snapshot first.",

    // Diff & Analysis Tab
    analysis_tab_history_diff: "Single User History Diff",
    analysis_tab_cross_network: "Cross-User Network Analysis",
    cross_user_a_label: "Perspective Creator (User A)",
    cross_user_b_label: "Target User / Account (User B)",
    cross_user_c_label: "Context Creator (User C - Optional)",
    cross_user_c_none: "None (Do not compare 3rd user)",
    cross_custom_b_placeholder: "Enter any Instagram username...",
    cross_btn_analyze: "Analyze Social Network",
    cross_loading: "Analyzing relationship chains and mutual network...",
    cross_direct_title: "Direct Follow Relationship",
    cross_triad_title: "Triadic Connection & Context",
    cross_insights_title: "Smart Network Insights & Discoveries",
    cross_tab_mutual_following: "Mutual Following",
    cross_tab_mutual_followers: "Mutual Followers",
    cross_tab_a_only: "User A Only",
    cross_tab_b_only: "User B Only",
    cross_empty_mutual: "No overlap found for this category",
    cross_overlap_rate: "Network Overlap",
    cross_custom_b_toggle: "Custom Username",
    cross_select_b_toggle: "Select Tracked User",

    diff_mode_following: "Following Snapshots",
    diff_mode_followers: "Followers Snapshots",
    diff_target_following: "Target Following (New):",
    diff_target_followers: "Target Followers (New):",
    diff_base_following: "Base Following (Old):",
    diff_base_followers: "Base Followers (Old):",
    diff_target_label: "Target Snapshot:",
    diff_base_label: "Base Comparison:",
    diff_no_base: "No comparison (Single snapshot)",
    diff_recalc_btn: "Recalculate Diff",
    diff_metric_total: "Total Users",
    diff_metric_added: "New Added",
    diff_metric_removed: "Unfollowed / Lost",
    diff_metric_stories: "Posted Stories",
    diff_filter_all: "All",
    diff_filter_added: "✨ New Added",
    diff_filter_removed: "❌ Unfollowed",
    diff_filter_story: "🔥 With Stories",
    diff_filter_private: "🔒 Private",
    diff_search_placeholder: "Search username or full name...",
    diff_col_user: "User",
    diff_col_status: "Status",
    diff_col_story: "Story",
    diff_col_private: "Private",
    diff_col_avatar: "Avatar",
    diff_col_actions: "Action",
    diff_status_added: "Added",
    diff_status_removed: "Removed",
    diff_status_retained: "Retained",
    diff_private_yes: "Private",
    diff_private_no: "Public",
    diff_avatar_changed: "Avatar Changed",
    diff_avatar_same: "Unchanged",

    // Modals: General Settings
    modal_settings_title: "General Settings & Preferences",
    modal_settings_tab_appearance: "Appearance",
    modal_settings_tab_preferences: "Preferences",
    modal_settings_tab_account: "Account & Cookie",
    modal_settings_tab_storage: "Storage & System",

    settings_density_title: "List Item Display Density & Element Size",
    settings_density_desc: "Adjust avatar and username dimensions across Following and Followers lists for optimal visual comfort.",
    settings_density_compact: "Compact Mode",
    settings_density_compact_sub: "38px Avatar · 13px Font",
    settings_density_comfortable: "Comfortable (Default Enlarged)",
    settings_density_comfortable_sub: "50px Avatar · 14.5px Font",
    settings_density_large: "Large & Clear",
    settings_density_large_sub: "60px Extra-Large Avatar · 16.5px Font",

    settings_stories_size_title: "Stories Gallery Card Layout",
    settings_stories_size_desc: "Control stories card width and column layout across responsive screens.",
    settings_stories_standard: "Standard 4-Column (260px)",
    settings_stories_large: "Spacious 3-Column (320px)",

    settings_time_format_title: "Global Timestamp Format",
    settings_time_format_desc: "Choose between 12-hour (AM/PM) and 24-hour time across the platform.",
    settings_time_12h: "12-Hour (AM / PM)",
    settings_time_24h: "24-Hour (00:00 - 23:59)",

    settings_page_size_title: "Default List Page Size",
    settings_page_size_desc: "Number of users loaded per page upon visiting creator lists.",
    settings_page_25: "25 per page",
    settings_page_50: "50 per page (Standard)",
    settings_page_100: "100 per page (High Capacity)",

    settings_analysis_default_title: "Default Analysis Mode",
    settings_analysis_default_desc: "Preferred view when entering the Data Analysis & Diff tab.",
    settings_analysis_following: "Following Analysis",
    settings_analysis_followers: "Followers Analysis",

    settings_storage_title: "Storage Overview & System Maintenance",
    settings_storage_desc: "View local creator storage statistics and reset display preferences.",
    settings_stat_creators: "Tracked Creators",
    settings_stat_stories: "Archived Stories",
    settings_stat_snapshots: "Historical Snapshots",
    settings_reset_btn: "Reset All Preferences to Default",
    settings_reset_confirm: "Are you sure you want to reset all display and preference settings?",

    modal_settings_cookie_sec: "Instagram Session Cookie",
    modal_settings_ready: "Configured",
    modal_settings_unready: "Not Configured",
    modal_settings_cookie_tip: "Used to fetch public creator stories and lists. All cookies are stored locally on your machine.",
    modal_settings_auto_login: "Open Browser to Login",
    modal_settings_manual_title: "Paste Cookie String",
    modal_settings_manual_placeholder: "Paste complete cookie string containing sessionid and ds_user_id...",
    modal_settings_save_cookie: "Save Cookie",
    modal_settings_saved_success: "Cookie saved successfully!",
    modal_settings_logs_sec: "Live Crawl Logs & Terminal Output",
    modal_settings_show_logs: "Show Terminal Logs",
    modal_settings_hide_logs: "Hide Terminal Logs",
    modal_settings_clear_logs: "Clear Logs",

    // Modals: Delete User
    modal_delete_title: "Delete All Creator Data?",
    modal_delete_desc: "Are you sure you want to permanently delete all archived data for @{username}? This includes downloaded story videos, photos, and followers/following snapshots. This action cannot be undone.",
    modal_delete_cancel: "Cancel",
    modal_delete_confirm: "Delete Permanently",
    modal_delete_success: "Creator data permanently deleted!",

    // Modals: Avatar Preview
    modal_avatar_title: "Creator HD Avatar",
    modal_avatar_download: "Download HD Avatar",
    modal_avatar_open_tab: "Open in New Tab",

    // Modals: Media Viewer
    modal_media_video_title: "Story Video Player",
    modal_media_img_title: "Story Image Preview",

    // Toast Messages
    task_running_toast: "Task is running...",
    task_completed_toast: "Task completed!",
    task_error_toast: "Task error",
  }
};

export function getTranslation(key, lang = 'zh', params = {}) {
  const dict = translations[lang] || translations.zh;
  let text = dict[key] || translations.zh[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

// 全局统一时间格式化：支持 12 小时制 (AM/PM) 与 24 小时制
export function formatToAmPm(timeStr, includeDate = true, includeSeconds = false, format = '12h') {
  if (!timeStr) return '';
  const str = String(timeStr).trim();

  // 24 小时制模式
  if (format === '24h') {
    if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(str)) {
      const parts = str.split(':');
      const padHour = parts[0].padStart(2, '0');
      return includeSeconds && parts[2] ? `${padHour}:${parts[1]}:${parts[2]}` : `${padHour}:${parts[1]}`;
    }
    const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      const padHour = match[4].padStart(2, '0');
      const minutes = match[5];
      const seconds = match[6] || '';
      const timePart = includeSeconds && seconds ? `${padHour}:${minutes}:${seconds}` : `${padHour}:${minutes}`;
      return includeDate ? `${year}-${month}-${day} ${timePart}` : timePart;
    }
    return str;
  }
  
  // 12 小时制 (AM / PM)
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(str)) {
    const parts = str.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const seconds = parts[2] || '';
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const padHour = hours < 10 ? `0${hours}` : hours;
    return includeSeconds && seconds ? `${padHour}:${minutes}:${seconds} ${period}` : `${padHour}:${minutes} ${period}`;
  }

  // 完整日期时间 YYYY-MM-DD HH:mm:ss 或 YYYY/MM/DD
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    let hours = parseInt(match[4], 10);
    const minutes = match[5];
    const seconds = match[6] || '';
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const padHour = hours < 10 ? `0${hours}` : hours;
    const timePart = includeSeconds && seconds ? `${padHour}:${minutes}:${seconds} ${period}` : `${padHour}:${minutes} ${period}`;
    return includeDate ? `${year}-${month}-${day} ${timePart}` : timePart;
  }

  return str;
}

// 相对时间多语言处理
export function formatRelativeTime(relStr, lang = 'zh') {
  if (!relStr) return '';
  if (lang === 'zh') return relStr;
  let s = String(relStr);
  s = s.replace('刚刚', 'Just now');
  s = s.replace(/(\d+)\s*分钟前/, '$1m ago');
  s = s.replace(/(\d+)\s*小时前/, '$1h ago');
  s = s.replace('昨天 (历史归档)', 'Yesterday (Archived)');
  s = s.replace('昨天', 'Yesterday');
  s = s.replace(/(\d+)\s*天前 \(历史归档\)/, '$1d ago (Archived)');
  s = s.replace(/(\d+)\s*天前/, '$1d ago');
  s = s.replace('(历史归档)', '(Archived)');
  s = s.replace('历史归档', 'Archived');
  return s;
}
