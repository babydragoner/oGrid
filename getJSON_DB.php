<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');

class column
{
	public $field;
	public $title;
	public $width;
	public $hidden;
	public $editor;
	public $sortable;
	
    function column($id, $caption)
    {
        $this->field = $id;
        $this->title = $caption;
        $this->width = "100px";
        $this->hidden = false;
        $this->sortable = false;
    }
}
class combo
{
	public $type;
	public $options;
    function combo()
    {
        $this->type = "combo";
        $this->options = array();
    }
}
class option
{
	public $id;
	public $text;
    function option($id, $text)
    {
        $this->id = $id;
        $this->text = $text;
    }
}
class Course
{
	public $CourseID;
	public $Title;
	public $Credits;
}
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
$sql = "SELECT * FROM Course";
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

$result["total"] = 30;
$result["rows"] = $items;
$result["msg"] = $sql;

if($type == "init")
{
	$columns = array();
	$col = new column("CourseID", "code");
	$col->editor = "text";
	array_push($columns, $col);
	$col = new column("Title", "Title");
	$col->editor = "text";
	$col->sortable = true;
	array_push($columns, $col);
	$col = new column("Credits", "Credits");
	$col->sortable = true;
	$col->editor = new combo();
	$opt = new option("1", "1");
	array_push($col->editor->options, $opt);
	$opt = new option("2", "2");
	array_push($col->editor->options, $opt);
	$opt = new option("3", "3");
	array_push($col->editor->options, $opt);
	$opt = new option("4", "4");
	array_push($col->editor->options, $opt);
	array_push($columns, $col);
	$result["columns"] = $columns;
}

echo json_encode($result); 

?>