<?php
require_once("STDAL.php");

class DAL_Items extends STDAL
{
    public function __construct()
    {
		$this->tablename = "TestItem";
		$this->PrimaryKey = "Id";
		$this->criField = array("Id", "WebSite", "Description", "CreUser", "CreDate");
		
    }
    
}
?>