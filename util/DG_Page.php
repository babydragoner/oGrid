<?php

/**
	* @file DG_Page.php
	* @brief 基本檔j網頁的資料處理
	* @author watson
	* @version 1.0
	* @date 2012-10-05
 */
class DG_Page 
{
    var $db;
    var $dal;
    
    /**
	    * @brief 建構式
	    *
	    * @param $fdal	該網頁資料處理對應的 DAL
	    *
	    * @return 
     */
    public function __construct(IDAL $fdal)
    {
		$CONFIG_DIR = "/home/a7091930/public_html/samples/";
		require_once($CONFIG_DIR."db/DB_config.php");
		require_once($CONFIG_DIR."db/DB_Class.php");
    require_once($CONFIG_DIR."util/Common.php");
		
		//if (!empty($fdal))
		//{
			//return die(get_class($this)."->".__FUNCTION__." => DAL not define");
		//}
		
		$this->db = new DB();
		$this->db->connect_db($_DB['host'], $_DB['username'], $_DB['password'], $_DB['dbname']);
		
		$this->dal = $fdal;
		$this->dal->setDB($this->db);
    }
    
    /**
	    * @brief 處理 Post 回來的資料，$_REQUEST['type'] 不能為空
	    *
	    * @return Type=Insert, Update 成功 回傳 array('success'=>true)
	    * 	Type=Data 回傳 EasyUI 用的資料集
	    *	Type=Qry 回傳 JSON 資料集
     */
    public function dealPost()
    {
		$result = false;
			
		$type = $_REQUEST['type'];
		$msg = "";
		
		if (!empty($_REQUEST["forKey"]))
		{
			$_REQUEST[$this->dal->Foreignkey] = $_REQUEST["forKey"];
		}
		if($type != "init" && $type != "data")
		{
			if(isset($_POST['data'])){
				$jsonStr = stripslashes($_POST['data']);
				$obj = json_decode($jsonStr);
				if($type == "del")
				{
					$prop = $this->dal->PrimaryKey;
					$var = $obj->$prop;
					$result = $this->dal->delete($var);
				}else if($type == "add"){
					$result = $this->dal->insert($obj);
					if ($result == "true"){
						$res = array();
						$res["success"] = true;
						$updateObject = $this->dal->afterSave($obj, false);
            $updObj = new updateObject($this->dal->PrimaryKey, $this->db->get_insert_id());
            array_push($updateObject, $updObj);
						$res["updateObject"] = $updateObject;
						return $res;
					}
				}else if($type == "mod"){
					$result = $this->dal->update($obj);
				}
			}else{
				$result = "Not data";
			}
		}else if($type == "init" || $type == "data"){
			
			$res = array();
			
			$res["total"] = $this->dal->getTotalCount();
			
			$items = $this->dal->getData($_REQUEST);

			$res["rows"] = $items;
			
			return $res;
		}
		
		if($type != "init" && $type != "data")
		{
			if ($result == "true"){
				return array('success'=>true);
			} else {
				
				return array('msg'=>'had errors occured. ' . $result);
			}
		}
    }
}
?>
