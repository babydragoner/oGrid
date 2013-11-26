<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');


class Item
{
	public $Id;
	public $WebSite;
	public $Description;
	public $CreUser;
	public $CreDate;
}
require_once("./util/Common.php");
require_once("./db/DB_config.php");
require_once("./db/DB_Class.php");

$type = $_GET["type"];;
$page = isset($_POST['page']) ? intval($_POST['page']) : 0; 
$rows = isset($_POST['rows']) ? intval($_POST['rows']) : 10; 
$sort = isset($_POST['sort']) ? strval($_POST['sort']) : "";
$offset = ($page)*$rows;
if($sort != "")
{
	$sort = "Order By $sort";
}
$sql = "SELECT * FROM TestItem";
$sql = $sql." $sort limit $offset,$rows";

$db = new DB();
$db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbname']);
$res = $db->query($sql);
if($res == "true"){
	$items = array();  
	while($row = $db->fetch_assoc()){  
		array_push($items, $row);  
	}
}else{
	echo get_class($this)."->".__FUNCTION__." at ".__LINE__." => $res";
}

//$result["total"] = 30;
$result["rows"] = $items;
$result["msg"] = '';

if($type == "init")
{
	$columns = array();
	$col = new column("Id", "No");
	$col->editor = "text";
	$col->width = "60px";
	array_push($columns, $col);
	$col = new column("WebSite", "Your WebSite");
	$col->editor = "text";
	$col->sortable = true;
	array_push($columns, $col);
	$col = new column("Description", "Description");
	$col->editor = "text";
	$col->sortable = true;
	$col->width = "200px";
	array_push($columns, $col);
	$col = new column("CreUser", "Your Name");
	$col->editor = "text";
	$col->sortable = true;
	array_push($columns, $col);
	$col = new column("CreDate", "The Date");
	$col->editor = "date";
	$col->sortable = true;
	array_push($columns, $col);
	$result["columns"] = $columns;
}

echo json_encode($result); 

?>