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
	require_once("./db/DAL/STDAL.php");
	$prgName = "Items";	
	$dal = DALFactory::getInstance($prgName);

	if (!empty($_REQUEST['type']) )
	{
		require_once("./util/DG_Page.php");
		
		$_POST['sort'] = "CreDate";
		
		$myPage = new DG_Page($dal);
		
		$result = $myPage->dealPost();
		
		if($_REQUEST['type'] == "init")
		{
			$columns = array();
			$col = new column("Id", "No");
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
			$col->sortable = true;
			array_push($columns, $col);
			$result["columns"] = $columns;
		}

		echo json_encode($result); 
	}else{
		echo "No Request.";
	}
	
//echo $_REQUEST['type']; 

?>