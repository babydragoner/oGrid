<?php

/**
	* @file IDAL.php
	* @brief 設定 DAL 標準該有的介面
	* @author watson
	* @version 1.0
	* @date 2012-10-05
 */
interface IDAL
{
    /**
	    * @brief 設定要操作的資料庫
	    *
	    * @param $id	要操作的資料庫
	    *
	    * @return 無回傳值
     */
    public function setDB($fdb);
    
    /**
	    * @brief 藉由table 的唯一主 key 來刪除特定資料
	    *
	    * @param $id	要刪除資料的 key 值
	    *
	    * @return 成功回傳 'true', 失敗回傳 錯誤信息
     */
    public function delete($id);
    
    /**
	    * @brief 更新資料，資料從 $_REQUEST 取得，索引名稱需與 資料庫 table 的欄位名稱一致
	    *
	    * @return 成功回傳 'true', 失敗回傳 錯誤信息
     */
    public function update();
    
    /**
	    * @brief 新增資料，資料從 $_REQUEST 取得，索引名稱需與 資料庫 table 的欄位名稱一致
	    *
	    * @return 成功回傳 'true', 失敗回傳 錯誤信息
     */
    public function insert();
    
    /**
	    * @brief 取得目前資料的總筆數
	    *
	    * @return 回傳資料的總筆數
     */
    public function getTotalCount();
    
    /**
	    * @brief 藉由查詢條件 criValues 來取得資料
	    *
	    * @param $criValues	該網頁資料處理對應的 DAL
	    *
	    * @return 回傳資料集陣列
     */
    public function getData($criValues);
}

?>