<?php
/**
 * Direct MySQL inject of Gutenberg Custom HTML (bypasses WP when CLI can't reach DB via localhost).
 * Usage: php -c cli-php.ini inject_via_mysql.php home
 */
$slug = $argv[1] ?? 'home';
$host = '127.0.0.1';
$port = 10041;
$user = 'root';
$pass = 'root';
$db   = 'local';

$frag_dir = __DIR__ . '/fragments';

$slug_to_file = array(
	'home'                    => 'page-home.html',
	'about'                   => 'page-about.html',
	'leadership'              => 'page-leadership.html',
	'mini'                    => 'page-mini.html',
	'mini-excavators'         => 'page-mini.html',
	'wheel-loaders'           => 'page-wheel-loaders.html',
	'attachments'             => 'page-attachments.html',
	'construction-excavators' => 'page-construction-excavators.html',
	'mining-excavators'       => 'page-mining-excavators.html',
	'service-support'         => 'page-service-support.html',
	'refurbished-equipment'   => 'page-refurbished-equipment.html',
	'contact'                 => 'page-contact.html',
	'privacy-policy'          => 'page-privacy-policy.html',
	'terms-and-conditions'    => 'page-terms-and-conditions.html',
);

$gb = $frag_dir . '/gutenberg-' . $slug . '.html';
if ( is_file( $gb ) ) {
	$content = file_get_contents( $gb );
} else {
	$base = $slug_to_file[ $slug ] ?? ( 'page-' . $slug . '.html' );
	$path = $frag_dir . '/' . $base;
	if ( ! is_file( $path ) ) {
		fwrite( STDERR, "Missing fragment {$path}\n" );
		exit( 1 );
	}
	$html    = file_get_contents( $path );
	$content = "<!-- wp:html -->\n" . $html . "\n<!-- /wp:html -->\n";
}

// SEO from map
$title = '';
$desc  = '';
$mapf  = $frag_dir . '/page-map-full.json';
if ( is_file( $mapf ) ) {
	$map = json_decode( file_get_contents( $mapf ), true );
	if ( ! empty( $map[ $slug ]['title'] ) ) {
		$title = $map[ $slug ]['title'];
	}
	if ( ! empty( $map[ $slug ]['description'] ) ) {
		$desc = $map[ $slug ]['description'];
	}
}

$mysqli = new mysqli( $host, $user, $pass, $db, $port );
if ( $mysqli->connect_error ) {
	fwrite( STDERR, 'Connect fail: ' . $mysqli->connect_error . "\n" );
	exit( 1 );
}
$mysqli->set_charset( 'utf8mb4' );

// Resolve page ID
$page_id = 0;
if ( 'home' === $slug ) {
	$res = $mysqli->query( "SELECT option_value FROM wp_options WHERE option_name='page_on_front' LIMIT 1" );
	$row = $res ? $res->fetch_assoc() : null;
	$page_id = $row ? (int) $row['option_value'] : 0;
	if ( ! $page_id ) {
		$res = $mysqli->query( "SELECT ID FROM wp_posts WHERE post_type='page' AND post_name='home' AND post_status='publish' LIMIT 1" );
		$row = $res ? $res->fetch_assoc() : null;
		$page_id = $row ? (int) $row['ID'] : 0;
	}
} else {
	$stmt = $mysqli->prepare( "SELECT ID FROM wp_posts WHERE post_type='page' AND post_name=? AND post_status IN ('publish','draft') ORDER BY post_status='publish' DESC LIMIT 1" );
	$stmt->bind_param( 's', $slug );
	$stmt->execute();
	$res = $stmt->get_result();
	$row = $res->fetch_assoc();
	$page_id = $row ? (int) $row['ID'] : 0;
	$stmt->close();

	if ( ! $page_id ) {
		// create
		$post_title = ucwords( str_replace( '-', ' ', $slug ) );
		$now        = gmdate( 'Y-m-d H:i:s' );
		$stmt       = $mysqli->prepare(
			"INSERT INTO wp_posts (post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count)
			 VALUES (1, ?, ?, ?, ?, '', 'publish', 'closed', 'closed', ?, '', '', ?, ?, '', 0, '', 0, 'page', '', 0)"
		);
		$stmt->bind_param( 'sssssss', $now, $now, $content, $post_title, $slug, $now, $now );
		if ( ! $stmt->execute() ) {
			fwrite( STDERR, 'Insert fail: ' . $stmt->error . "\n" );
			exit( 1 );
		}
		$page_id = (int) $stmt->insert_id;
		$stmt->close();
		// guid
		$guid = 'http://wwa.local/?page_id=' . $page_id;
		$mysqli->query( "UPDATE wp_posts SET guid='" . $mysqli->real_escape_string( $guid ) . "' WHERE ID=" . $page_id );
		echo "Created page {$slug} ID={$page_id}\n";
	}
}

if ( ! $page_id ) {
	fwrite( STDERR, "No page ID for {$slug}\n" );
	exit( 1 );
}

$stmt = $mysqli->prepare( 'UPDATE wp_posts SET post_content=?, post_modified=?, post_modified_gmt=? WHERE ID=?' );
$now  = gmdate( 'Y-m-d H:i:s' );
$stmt->bind_param( 'sssi', $content, $now, $now, $page_id );
if ( ! $stmt->execute() ) {
	fwrite( STDERR, 'Update fail: ' . $stmt->error . "\n" );
	exit( 1 );
}
$stmt->close();

// Yoast meta helpers
function upsert_meta( mysqli $m, int $post_id, string $key, string $value ): void {
	if ( '' === $value ) {
		return;
	}
	$stmt = $m->prepare( 'SELECT meta_id FROM wp_postmeta WHERE post_id=? AND meta_key=? LIMIT 1' );
	$stmt->bind_param( 'is', $post_id, $key );
	$stmt->execute();
	$res = $stmt->get_result();
	$row = $res->fetch_assoc();
	$stmt->close();
	if ( $row ) {
		$stmt = $m->prepare( 'UPDATE wp_postmeta SET meta_value=? WHERE meta_id=?' );
		$mid  = (int) $row['meta_id'];
		$stmt->bind_param( 'si', $value, $mid );
		$stmt->execute();
		$stmt->close();
	} else {
		$stmt = $m->prepare( 'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?,?,?)' );
		$stmt->bind_param( 'iss', $post_id, $key, $value );
		$stmt->execute();
		$stmt->close();
	}
}

upsert_meta( $mysqli, $page_id, '_yoast_wpseo_title', $title );
upsert_meta( $mysqli, $page_id, '_yoast_wpseo_metadesc', $desc );

// Clear object cache if any (transients for post)
$mysqli->query( "DELETE FROM wp_options WHERE option_name LIKE '%_transient_%' AND option_name LIKE '%post%'" );

$len = strlen( $content );
$has = ( strpos( $content, '<!-- wp:html -->' ) !== false ) ? 'yes' : 'no';
$el  = ( strpos( $content, 'data-elementor-type="wp-page"' ) !== false ) ? 'yes' : 'no';
echo "OK slug={$slug} ID={$page_id} len={$len} gutenberg={$has} elementor={$el}\n";
if ( $title ) {
	echo "  SEO title: {$title}\n";
}
if ( $desc ) {
	echo "  SEO desc: " . substr( $desc, 0, 100 ) . "\n";
}

$mysqli->close();
