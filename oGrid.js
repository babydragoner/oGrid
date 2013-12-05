/*
* oGrid for pure javascript -  v0.61
*
* Copyright (c) 2013 watson chen (http://code.google.com/p/obj4u/)
* Dual licensed under the GPL Version 3 licenses.
*
*/
var obj4u = obj4u || {};

obj4u.oGrid = function oGrid(fcontainer, params) {
    this.container = fcontainer;
    this.totalRow;
    this.rows = [];
    this.columns = [];
    this.editors = obj4u.editors;
    this.loadUrl;
    this.reloadPage = true;
    this.showNavigation = true;
    this.showToolbar = false;
    this.isOData = false;
    this.multiSelect = true;
    this.lastSelectedItem;
    this.lastSelectedIndex;
    this.totalPage;
    this.pageNames = ['First', 'Previous', 'Next', 'Last']
    this.pageNumber = 0;
    this.pageSize = 10;
    this.event = new obj4u.EventContorller(this);
    this.toolbar;

    if (!this.container.className) {
        this.container.className = "oGrid";
    }

    if (params) {
        if (params.loadUrl) {
            this.loadUrl = params.loadUrl;
        }
        if (params.columns) {
            this.columns = params.columns;
        }
    }

    this.addColumn = function (col) {
        this.columns[this.columns.length] = col;
        return col;
    }
    this.addRows = function (rowData) {
        if (typeof rowData == 'object') {
            if (!rowData.length) {
                this.setRow(rowData);
                this.totalRow++;
            } else {
                for (var i = 0; i < rowData.length; ++i) {
                    this.setRow(rowData[i]);
                    this.totalRow++;
                }
            }
        }
    }

    function addPageCilckEvent(obj, control, pageNum) {
        control.addEventListener("click",
                         function () {
                             obj.changePageNumber(pageNum);
                         },
                         false);
    }

    this.acceptChanges = function (dataIndex) {
        if (obj4u.HadValue(dataIndex)) {
            var rowElement = getRowElementByID.call(this, "row" + dataIndex);
            var row = this.rows[dataIndex];
            for (var i in rowElement.children) {
                var cell = rowElement.children[i];
                if (cell.editor) {
                    var val = cell.editor.getValue(cell.editor.control);
                    row[cell.field] = val;
                }
            }
            var res, action;
            if (row.state == "insert") {
                action = "insert";
                row.state = "none";
            } else{
                action = "update";
            }
            res = this.sendAction(action, null, row);
            if (res) {
                if (res.success) {
                    if (res.updateObject) {
                        for (var i = 0; i < res.updateObject.length; ++i) {
                            var updObj = res.updateObject[i];
                            row[updObj.field] = updObj.value;
                        }
                    }
                    //this.onLog(action + " successed.");
                    this.showMessage(action + " successed.");
                } else {
                    this.showMessage(res.msg);
                }
            } else {
                this.showMessage(action + " had error.");
            }

            this.editRow(dataIndex, false);
        }
    }

    this.apply = function () {
        var row;
        if (this.lastSelectedItem) {
            var dataIndex = this.lastSelectedIndex;
            row = this.rows[dataIndex];
            var rowElement = this.lastSelectedItem;
            if (row.edit) {
                this.acceptChanges(dataIndex);
            } else {
                row = null;
                this.onLog("please edit row.");
            }
        } else {
            this.onLog("please select apply row.");
        }
        return row;
    }

    this.changePageNumber = function (pageNum) {
        if (pageNum > this.totalPage)
            pageNum = 0;
        this.pageNumber = pageNum;
        this.refeshPage();
    }

    this.edit = function () {
        var row;
        if (this.lastSelectedItem) {
            var dataIndex = this.lastSelectedIndex;
            row = this.rows[dataIndex];
            if (!row.edit) {
                this.editRow(dataIndex, true);
            } else {
                this.editRow(dataIndex, false);
            }
        } else {
            this.onLog("please select edit row.");
        }
        return row;
    }

    this.editRow = function (dataIndex, isEdit) {
        if (obj4u.HadValue(dataIndex)) {
            var rowElement = getRowElementByID.call(this, "row" + dataIndex);
            var row = this.rows[dataIndex];
            if (isEdit) {
                if (!row.edit) {
                    if (!row.selected) {
                        this.selectRow(rowElement);
                    }
                    row.edit = true;
                    if (rowElement) {
                        this.renderRow(rowElement, row);
                    }
                }
            } else {
                row.edit = false;
                if (rowElement) {
                    this.unselectedRow(rowElement, row);
                    this.renderRow(rowElement, row);
                }
                //this.onAfterEdit(row);
            }
        }
    }

    this.getColumn = function (field) {
        var col = null;
        if (!field) {
            this.onLog("field is empty.");
            return col;
        }
        for (var i = 0; i < this.columns.length; ++i) {
            if (this.columns[i].field == field) {
                col = this.columns[i];
                break;
            }
        }
        if (!col) {
            this.onLog(field + " column was ont found.");
            return col;
        }
        return col;
    }

    this.getDefaultColumn = function () {
        var col = [];
        col.field = "";
        col.title = "";
        col.width = "100px";
        col.colspan = 1;
        col.rowspan = 1;
        col.hidden = false;
        col.sortable = true;
        col.order = null;
        col.formatter = null;
        col.styler = null;
        col.editor = "text";
        return col;
    }

    this.getBlankRow = function () {
        var obj = this.rows[0];
        var temp = obj.constructor();
        for (var key in obj) {
            if (typeof (obj[key]) == 'boolean')
                temp[key] = false;
            else if (typeof (obj[key]) == 'number')
                temp[key] = 0;
            else
                temp[key] = '';
        }
        temp.state = "insert";
        return temp;
    }

    this.getODataParams = function (params) {
        if (!params)
            params = {};
        params.inlinecount = "allpages";
        params.top = this.pageSize;
        if (this.pageNumber > 0) {
            params.skip = this.pageNumber * this.pageSize;
        }
        params.orderby = "";
        for (var i = 0; i < this.columns.length; ++i) {
            var col = this.columns[i];
            if (col.sortable) {
                if (col.order) {
                    if (params.orderby)
                        params.orderby += ",";

                    params.orderby += col.field + " " + col.order;
                }
            }
        }
        return params;
    }

    this.getQryParams = function (params) {
        if (this.isOData) {
            return this.getODataParams();
        }
        if (!params)
            params = {};
        params.page = this.pageNumber;
        params.rows = this.pageSize;

        params.sort = "";
        for (var i = 0; i < this.columns.length; ++i) {
            var col = this.columns[i];
            if (col.sortable) {
                if (col.order) {
                    if (params.sort)
                        params.sort += ",";

                    params.sort += col.field + " " + col.order;
                }
            }
        }
        return params;
    }

    var getRowElementByID = function (id) {
        var rowCount = this.container.rows.length;
        for (var i = 1; i < rowCount; ++i) {
            if (this.container.rows[i].id == id)
                return this.container.rows[i];
        }
        return null;
    }

    this.getSelectRows = function () {
        var selectRows = [];
        for (var i = 0; i < this.rows.length; ++i) {
            if (this.rows[i].selected) {
                selectRows[selectRows.length] = this.rows[i];
            }
        }
        return selectRows;
    }

    this.getEditor = function (name) {
        if (this.editors[name]) {
            var editor = new this.editors[name];
            return editor;
        } else {
            this.onLog("can't found " + name + " editor.");
            return null;
        }
    }

    this.insertRow = function (dataIndex, row) {
        if (!obj4u.HadValue(dataIndex))
            rowIndex = 0;
        if (!row) {
            row = this.getBlankRow();
        }
        this.rows.splice(dataIndex, 0, row);
        this.totalRow++;
        this.resetRowIndex();
        return row;
    }

    this.insertRowElement = function (isNormal) {
        var rowElement = this.container.insertRow(this.container.rows.length);
        if (isNormal) {
            var obj = this;
            rowElement.addEventListener("click",
                             function () {
                                 obj.selectRow(this, "click");
                             },
                             false);
            rowElement.addEventListener("dblclick",
                             function () {
                                 obj.selectRow(this, "dblclick");
                             },
                             false);
            if (rowElement.rowIndex % 2 == 1)
                rowElement.className = "datarowodd";
            else
                rowElement.className = "dataroweven";
        }
        return rowElement;
    }
    this.insertCell = function (rowElement) {
        var cellElement = rowElement.insertCell(rowElement.cells.length);
        return cellElement;
    }

    this.loadData = function (jsonData) {
        if (!jsonData) {
            this.onLog("jsonData is empty.");
            return;
        }
        if (!jsonData.rows) {
            this.onLog("jsonData rows is empty.");
            return;
        }
        if (jsonData.rows.length <= 0) {
            this.onLog("jsonData length <= 0.");
            return;
        }

        if (jsonData.total)
            this.totalRow = jsonData.total;
        else
            this.totalRow = jsonData.rows.length;

        if (jsonData.columns) {
            this.columns = jsonData.columns;
        }

        if (this.columns.length <= 0) {
            for (var p in jsonData.rows[0]) {
                if (p != "rowStyle" && p != "cellStyle") {
                    var col = this.getDefaultColumn();
                    col.field = p;
                    col.title = p;
                    this.addColumn(col);
                }
            }
        }
        var start = this.pageNumber * this.pageSize;
        var last = start + this.pageSize;
        if (last > start + jsonData.rows.length)
            last = start + jsonData.rows.length;
        if (start == 0) {
            last = jsonData.rows.length;
        }

        var z = 0;
        for (var i = start; i < last; ++i) {
            var oldRow = this.rows[i];
            //this.rows[i] = jsonData.rows[z];
            this.setRow(jsonData.rows[z], i);
            this.rows[i].index = i;
            if (oldRow) {
                this.rows[i].selected = oldRow.selected;
            }

            z++;
        }
    }

    this.load = function (action, queryParams) {
        if (!this.loadUrl) {
            this.onLog("loadUrl is empty.");
            return;
        }
        if (!action)
            action = "data";
        this.sendAction(action, queryParams);
    }

    this.refeshPage = function () {
        if (this.loadUrl) {
            if (!this.reloadPage) {
                var start = this.pageNumber * this.pageSize;
                var last = start + this.pageSize;
                if (last > this.totalRow)
                    last = this.totalRow;
                if (!this.rows[start] && !this.rows[last]) {
                    this.load();
                }
            } else
                this.load();
        }
        this.renderData();
    }

    this.renderCell = function (rowElement, row, col) {
        if (col.hidden) {
            return;
        }
        var cell = this.insertCell(rowElement);
        if (!col.field) {
            this.onLog("col.field is empty.");
            return;
        }
        cell.field = col.field;

        cell.id = rowElement.id + cell.field;
        if (col.width)
            cell.width = col.width;

        var colValue = row[col.field];

        var editor;
        if (col.editor) {
            if (col.editor) {
                if (typeof (col.editor) == 'string') {
                    editor = this.getEditor(col.editor);
                } else if (col.editor.type) {
                    editor = this.getEditor(col.editor.type);
                }
            }
        }

        if (row.edit && row.selected) {
            if (editor) {
                if (editor.init) {
                    editor.control = editor.init(cell, col.editor.options);
                    editor.setValue(editor.control, colValue);
                    cell.editor = editor;
                }
            }
        } else {
            if (!colValue)
                colValue = '';
            else if (editor) {
                if (editor.getText) {
                    colValue = editor.getText(colValue, col.editor.options);
                }
            }
            if (col.align) {
                cell.align = col.align;
            }

            if (cell.align.toLowerCase() == 'right')
                cell.innerHTML = colValue + "&nbsp;";
            else
                cell.innerHTML = "&nbsp;" + colValue;
            if (row.cellStyle) {
                if (!row.cellStyle.length) {
                    this.setCellStyle(cell, row.cellStyle);
                } else {
                    for (var i = 0; i < row.cellStyle.length; ++i) {
                        this.setCellStyle(cell, row.cellStyle[i]);
                    }
                }
            }
        }
        return cell;
    }

    this.renderData = function () {
        //this.container.innerHTML = "";
        if (!this.showNavigation) {
            this.pageSize = this.totalRow;
        }

        this.totalPage = Math.ceil(this.totalRow / this.pageSize);
        if (this.pageNumber > this.totalPage || this.pageNumber < 0)
            this.pageNumber = 0;

        if (this.showToolbar && this.container.rows.length <= 0) {
            var rowElement = this.insertRowElement(false);
            this.renderToolbarHead(rowElement);
        } else {
            var rowCount = this.container.rows.length;
            for (var i = 1; i < rowCount; ++i) {
                this.container.deleteRow(1);
            }
        }

        if (this.showNavigation) {
            if (this.renderNavigationHead) {
                var rowElement = this.insertRowElement(false);
                this.renderNavigationHead(rowElement);
            }
        }

        if (this.container.rows.length <= 0 || (this.showToolbar && this.container.rows.length <= 1)) {
            this.renderRowHead();
        }

        var start = this.pageNumber * this.pageSize;
        var last = start + this.pageSize;
        if (last > this.totalRow)
            last = this.totalRow;

        for (var i = start; i < last; ++i) {
            rowElement = this.insertRowElement(true);
            var row = this.rows[i];
            rowElement.id = "row" + i;
            rowElement.dataIndex = i;
            this.renderRow(rowElement, row);
        }

        if (this.showNavigation) {
            rowElement = this.insertRowElement(false);
            this.renderNavigationFooter(rowElement);
        }
    }

    this.renderRowHead = function () {
        //var thead = document.createElement("thead");
        var thead = this.container.insertRow(this.container.rows.length);
        thead.className = "headerrow";
        for (var i = 0; i < this.columns.length; ++i) {
            var col = this.columns[i];
            if (col.hidden) {
                continue;
            }
            var th = document.createElement("th");
            th.colIndex = i;
            if (col.sortable) {
                th.className = "sortable";
                var obj = this;
                th.addEventListener("click",
                                 function () {
                                     obj.orderBy(obj.columns[this.colIndex]);
                                 },
                                 false);
            }
            th.innerHTML = "&nbsp;" + this.columns[i].title;
            if (col.order) {
                var span = document.createElement("span");
                if (col.order == "asc") {
                    span.className = "sort-asc";
                } else {
                    span.className = "sort-desc";
                }
                th.appendChild(span);
            }
            thead.appendChild(th);
        }
        //this.container.appendChild(thead);
    }
    //this.renderNavigationHead = function (rowElement) {
    //    //this.renderNavigationBar(rowElement);
    //}
    this.renderNavigationFooter = function (rowElement) {
        this.renderNavigationBar(rowElement);
    }

    this.renderNavigationBar = function (rowElement) {
        var td = document.createElement("td");
        td.setAttribute("colspan", this.columns.length);
        var div = document.createElement("div");
        div.className = "pagination";
        var ul = document.createElement("ul");
        var li, li2;
        li = document.createElement("li");
        li.innerHTML = this.pageNames[0];
        if (this.pageNumber == 0) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, 0);
        }
        ul.appendChild(li);
        li = document.createElement("li");
        li.innerHTML = this.pageNames[1];
        if (this.pageNumber == 0) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.pageNumber - 1);
        }
        ul.appendChild(li);

        for (var i = 0; i < this.totalPage; ++i) {
            li = document.createElement("li");
            li.innerHTML = i + 1;
            if (i == this.pageNumber) {
                li.className = "current";
            } else {
                li.className = "normal";
            }

            addPageCilckEvent(this, li, i);
            ul.appendChild(li);
        }

        li = document.createElement("li");
        li.innerHTML = this.pageNames[2];
        if (this.pageNumber == this.totalPage - 1) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.pageNumber + 1);
        }
        ul.appendChild(li);

        li = document.createElement("li");
        li.innerHTML = this.pageNames[3];
        if (this.pageNumber == this.totalPage - 1) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.totalPage - 1);
        }
        ul.appendChild(li);

        div.appendChild(ul);
        td.appendChild(div);
        rowElement.appendChild(td);
    }

    this.renderRow = function (rowElement, row) {
        if (!row) {
            this.onLog("row is empty.");
            return;
        }
        if (row.rowStyle) {
            if (row.rowStyle.className) {
                rowElement.className = row.rowStyle.className;
            } else {
                rowElement.setAttribute("style", row.rowStyle.style);
            }
        }
        if (row.selected && rowElement.className != "selected") {
            this.setSelectedRow(rowElement, row);
        }
        rowElement.innerHTML = "";
        for (var i = 0; i < this.columns.length; ++i) {
            this.renderCell(rowElement, row, this.columns[i]);
        }
    }

    this.renderToolbarHead = function (rowElement) {
        var td = document.createElement("td");
        td.setAttribute("colspan", this.columns.length);
        var div = document.createElement("div");
        div.id = "toolbarHead";

        this.toolbar = new obj4u.Toolbar(div, this);
        this.toolbar.event.AddEvent("onLog", this.onLog);

        td.appendChild(div);
        rowElement.appendChild(td);
    }

    this.removeRow = function (dataIndex) {
        if (obj4u.HadValue(dataIndex)) {
            var row = this.rows[dataIndex];
            if (row) {
                if (row.state != "insert") {
                    var date1 = new Date();
                    this.onLog(date1.getSeconds() + ":" + date1.getMilliseconds());
                    var res = this.sendAction("remove", null, row);
                    if (res.success) {
                        var date1 = new Date();
                        this.onLog(date1.getSeconds() + ":" + date1.getMilliseconds());
                        this.showMessage("remove successed.");
                        var date1 = new Date();
                        this.onLog(date1.getSeconds() + ":" + date1.getMilliseconds());
                        this.unselectedRow(this.lastSelectedItem, this.rows[this.lastSelectedItem.dataIndex]);
                        var self = this;
                        setTimeout(function () { self.refeshPage(); }, 100);
                        //this.refeshPage();
                        //var date1 = new Date();
                        //this.onLog(date1.getSeconds() + ":" + date1.getMilliseconds());
                        return true;
                    }
                }
            }
        }
        return false;
    }

    this.resetRowIndex = function () {
        for (var i = 0; i < this.rows.length; ++i) {
            this.rows[i].index = i;
        }
    }

    this.sendAction = function (action, queryParams, row) {

        if (action == "init" || action == "data")
            queryParams = this.getQryParams(queryParams);

        var furl = this.loadUrl;

        if (!this.isOData) {
            var urlType = "data";
            if (action == "init")
                urlType = "init";
            else if (action == "insert")
                urlType = "add";
            else if (action == "update")
                urlType = "mod";
            else if (action == "remove")
                urlType = "del";

            furl = furl + "?type=" + urlType;
        }

        var qry = "";
        if (queryParams) {
            for (var p in queryParams) {
                var pValue = queryParams[p];
                if (obj4u.HadValue(pValue)) {
                    if (qry.length > 0)
                        qry += "&";

                    if (this.isOData)
                        p = "%24" + p;

                    qry += p + "=" + pValue;
                }
            }
        }
        if (this.isOData && obj4u.HadValue(qry)) {
            furl += "?" + qry;
            qry = "";
        }
        var contentType = "application/x-www-form-urlencoded";
        if (!this.isOData) {
            method = "POST";
            qry = "data="+JSON.stringify(row);
        } else {
            if (action == "init" || action == "data")
                method = "GET";
            else if (action == "insert")
                method = "POST";
            else if (action == "update")
                method = "PUT";
            else if (action == "remove")
                method = "DELETE";
            contentType = "application/json";

            qry = JSON.stringify(row);
        }

        var fajax = new obj4u.Ajax();
        var res = fajax.sync({
            method: method,
            url: furl,
            contentType: contentType,
            data: qry
        });
        res = this.onLoadSuccess(res, action);
        if (action == "init" || action == "data")
            this.loadData(res);
        else {
            return res;
        }
    }

    this.selectRow = function (rowElement, type) {
        var i = rowElement.dataIndex;
        if (!this.rows[i].selected) {
            var flag = true;
            if (this.lastSelectedItem && !this.multiSelect) {
                flag = !this.rows[this.lastSelectedItem.dataIndex].edit;
                this.unselectedRow(this.lastSelectedItem, this.rows[this.lastSelectedItem.dataIndex]);
            }
            if (flag) {
                this.setSelectedRow(rowElement, this.rows[i]);
                if (type)
                    this.onSelectedRow(rowElement, this.rows[i]);
            }
        } else {
            this.unselectedRow(rowElement, this.rows[i]);
        }
        if (type == "click")
            this.onClickedRow(rowElement, this.rows[i]);
        else if (type == "dblclick")
            this.onDblClickedRow(rowElement, this.rows[i]);
    }

    this.setCellStyle = function (cell, cellStyle) {
        if (cell.field == cellStyle.field) {
            if (cellStyle.className) {
                cell.className = cellStyle.className;
            } else {
                cell.setAttribute("style", cellStyle.style);
            }
        }
    }

    this.setRow = function (rowData, dataIndex) {
        if (typeof rowData == 'object') {
            if (!obj4u.HadValue(dataIndex))
                dataIndex = this.rows.length;
            this.rows[dataIndex] = obj4u.Clone(rowData);
            this.rows[dataIndex].origin = obj4u.Clone(rowData);
            this.rows[dataIndex].state = "none";
        }
    }

    this.setSelectedRow = function (rowElement, row) {
        this.lastSelectedItem = rowElement;
        this.lastSelectedIndex = row.index;
        row.selected = true;
        rowElement.oldClassName = rowElement.className;
        rowElement.className = "selected";
    }

    this.showMessage = function (msg) {        
        var params = {};
        params.message = msg;
        params.isModal = true;
        params.top = (this.container.offsetTop + (this.container.offsetHeight / 2) - 50) + "px";
        params.left = (this.container.offsetLeft + (this.container.offsetWidth / 2) - 100) + "px";
        obj4u.MessageBox(document.body, params);
    }

    this.updateColumn = function (col) {
        if (!col) {
            this.onLog("col is empty.");
            return;
        }
        if (!col.field) {
            this.onLog("col.field is empty.");
            return;
        }
        for (var i = 0; i < this.columns.length; ++i) {
            if (this.columns[i].field == col.field) {
                this.columns[i] = col;
                break;
            }
        }
        this.columns[this.columns.length] = col;
        return col;
    }
    this.unselectedRow = function (rowElement, row) {
        if (!row.edit) {
            this.lastSelectedItem = null;
            this.lastSelectedIndex = null;
            row.selected = false;
            if (rowElement)
                rowElement.className = rowElement.oldClassName;
        }
    }

    this.orderBy = function (col) {
        if (!col.order) {
            col.order = "desc";
        }

        if (col.order == "asc") {
            col.order = "desc";
        } else {
            col.order = "asc";
        }
        this.refeshPage();
    }
    this.onAfterEdit = function (row, oriRow) {
    }
    this.onLog = function (msg) {
        if (window.console)
            console.log(msg);
    }
    this.onLoadSuccess = function (data, action) {
        if (this.isOData) {
            if (action == "init" || action == "data") {
                var res = {};
                res.total = data.Count;
                res.rows = data.Items;
            }
            return res;
        } else
            return data;
    }
    this.onDblClickedRow = function (rowElement, row) {
    }
    this.onClickedRow = function (rowElement, row) {
    }
    this.onSelectedRow = function (rowElement, row) {
    }
    this.onUnselectedRow = function (rowElement, row) {
    }
};

obj4u.comboBox = function (fcontainer, params) {
    this.container = fcontainer;
    this.control;
    this.loadUrl;
    this.isOData = false;
    this.valueField = "id";
    this.textField = "text";
    this.selectValue;
    this.selectText;
    this.selectIndex;
    var obj = this;
    this.data;
    this.setParams = function (params) {
        if (params) {
            if (params.loadUrl) {
                this.loadUrl = params.loadUrl;
            }
            if (params.valueField) {
                this.valueField = params.valueField;
            }
            if (params.textField) {
                this.textField = params.textField;
            }
            if (params.isOData) {
                this.isOData = params.isOData;
            }
        }
    }
    this.init = function (fcontainer, params) {
        if (fcontainer)
            this.container = fcontainer;
        this.setParams(params);
        var select = document.createElement("select");
        this.control = select;

        select.addEventListener("change",
                         function () {
                             //alert("select");
                             obj.selectValue = this.options[this.selectedIndex].value;
                             obj.selectText = this.options[this.selectedIndex].text;
                             obj.selectIndex = this.selectedIndex;
                         },
                         false);

        var data = this.getData(params);

        this.load(data);

        this.container.appendChild(select);
        return select;
    }
    this.load = function (options) {
        for (var i = 0; i < options.length; i++) {
            var opt = new Option(options[i][obj.textField], options[i][obj.valueField]);
            obj.control.options.add(opt);
        }
    }
    this.getData = function (params) {
        if (params.loadUrl) {
            if (!params.data) {
                var method = "POST";
                if (params.isOData)
                    method = "GET";
                var fajax = new obj4u.Ajax();
                var res = fajax.sync({
                    method: method,
                    url: params.loadUrl
                });
                if (params.isOData)
                    params.data = res.Items;
            }
            data = params.data;
        } else {
            data = params;
        }
        return data;
    }
    this.getValue = function (target) { // return save value
        //var val = target.options[target.selectedIndex].value;
        return this.selectValue;
    }
    this.getText = function (value, params) { // return display text
        var val = value;
        var data = this.getData(params);
        for (var i = 0; i < data.length; i++) {
            if (data[i][params.valueField] == value) {
                val = data[i][params.textField];
                break;
            }
        }
        return val;
    }
    this.setValue = function (target, value) {
        for (var i = 0; i < target.options.length; i++) {
            if (target.options[i].value == value) {
                target.options[i].selected = true;
                return;
            }
        }
    }
    this.resize = function (target, width) {
        target.width = width;
    }
    //this.init();
}

obj4u.Button = function (fcontainer, params) {
    var container = fcontainer;
    var obj = this;
    this.event = new obj4u.EventContorller(this);

    var btn = document.createElement("input");
    btn.type = "button";
    btn.className = "btn";
    if (params) {
        btn.id = params.id;
        btn.value = params.caption;
        this.click_event = params.onclick;
    }
    btn.onclick = function () {
        obj.onclick(obj);
    };
    container.appendChild(btn);

    Object.defineProperty(this, "id", {
        get: function () { return btn.id; },
        set: function (val) {
            btn.id = val;
        }
    });
    Object.defineProperty(this, "caption", {
        get: function () { return btn.value; },
        set: function (val) {
            btn.value = val;
        }
    });
    Object.defineProperty(this, "onclick", {
        get: function () { return this.click_event; },
        set: function (val) {
            this.click_event = val;
        }
    });
    Object.defineProperty(this, "enabled", {
        get: function () { return !btn.disabled; },
        set: function (val) {
            btn.disabled = !val;
        }
    });
    this.onclick = function (sender) {
        sender.click_event.call(sender);
    };
}

obj4u.MessageBox = function (fcontainer, params) {
    var container = fcontainer;
    var obj = this;
    if (!params)
        params = {isModal: true};

    if (params.isModal) {
        var back = document.createElement("div");
        back.setAttribute("style", "position: fixed; left: 0; top: 0;z-index:1002;width:100%;height:100%;background:#000;opacity:0.5;filter: alpha(opacity=50);-moz-opacity: 0.5;");
        back.innerHTML = "&nbsp;";
        container.appendChild(back);
    }

    var control = document.createElement("div");
    control.setAttribute("style", "z-index:1003;padding:5px;text-align:center;border-color: rgba(0,0,0,0.3);position: absolute; border-radius: 6px;background:#fff;box-shadow: 1px 1px 7px 1px rgba(128,128,128,0.3);");
    if (params.top) {
        control.style.top = params.top;
    } else {
        control.style.top = "20%";
    }
    if (params.left) {
        control.style.left = params.left;
    } else {
        control.style.left = "30%";
    }

    if (params.height) {
        control.style.height = params.height;
    } else {
        control.style.height = "100px";
    }
    if (params.width) {
        control.style.width = params.width;
    } else {
        control.style.width = "200px";
    }
    var content = document.createElement("div");
    content.setAttribute("style", "height:60%;width:100%;text-align:center;padding-top:10px;");
    content.innerHTML = "<span style='top: 20%;'>" + params.message + "</span>";
    control.appendChild(content);

    var btn = new obj4u.Button(control, { id: "btnClose", caption: "close" });
    btn.onclick = function (sender) {
        obj.onClose(sender);
    };

    container.appendChild(control);

    this.onClose = function () {
        if (back)
            container.removeChild(back);

        container.removeChild(control);
    }
}

obj4u.Toolbar = function (fcontainer, foGrid, params) {
    var objGrid = foGrid;
    this.container = fcontainer;
    this.container.className = "toolbar";
    this.event = new obj4u.EventContorller(this);
    this.buttons = {};
    var obj = this;

    this.initButton = function () {
        this.buttons.btnEdit = this.addButton("btnEdit", "edit");
        this.buttons.btnApply = this.addButton("btnApply", "apply");
        this.buttons.btnApply.enabled = false;
        this.buttons.btnInsert = this.addButton("btnInsert", "insert");
        this.buttons.btnRemove = this.addButton("btnRemove", "remove");
    }

    this.acceptChanges = function (row) {
        if (row.edit) {
            this.buttons.btnEdit.caption = "cancel";
            this.buttons.btnApply.enabled = true;
            this.buttons.btnInsert.enabled = false;
            this.buttons.btnRemove.enabled = false;
        } else {
            this.buttons.btnEdit.caption = "edit";
            this.buttons.btnApply.enabled = false;
            this.buttons.btnInsert.enabled = true;
            this.buttons.btnRemove.enabled = true;
        }
    }
    this.addButton = function (id, caption) {
        var btn = new obj4u.Button(this.container, { id: id, caption: caption });
        btn.onclick = function (sender) {
            if (obj.onBeforeBtnClick(sender)) {
                obj.btnClick(sender);
            }
        };
        return btn;
    }

    this.btnClick = function (btn) {
        var id = btn.id;
        if (id == "btnEdit") {
            this.edit();
        }
        else if (id == "btnApply") {
            this.apply();
        }
        else if (id == "btnInsert") {
            this.insertRow();
        }
        else if (id == "btnRemove") {
            this.removeRow();
        } else {
            this.onCustomBtnClick(btn);
        }
    }

    this.edit = function () {
        var row = objGrid.edit();
        if (row) {
            this.acceptChanges(row);
        }
    }

    this.apply = function apply() {
        var row = objGrid.apply();
        if (row) {
            this.acceptChanges(row);
        }
    }

    this.insertRow = function insertRow() {
        var row = objGrid.insertRow();
        objGrid.renderData();
        objGrid.editRow(0, true);
        this.acceptChanges(row);
    }

    this.removeRow = function () {
        if (objGrid.lastSelectedItem) {
            var dataIndex = objGrid.lastSelectedIndex;
            objGrid.removeRow(dataIndex);
                //objGrid.renderData();
        } else {
            this.onLog("please select row.");
        }
    }

    this.onBeforeBtnClick = function (btn) {
        return true;
    }
    this.onCustomBtnClick = function (btn) {
        return true;
    }
    this.onLog = function (msg) {
    }

    // init toolbar
    this.initButton();
}

obj4u.EventContorller = function (fcontrol) {
    var control = fcontrol;

    this.AddEvent = function (eventName, eventObject) {
        var event = control[eventName];
        if (event)
            control[eventName] = eventObject;
    }
    this.removeEvent = function (eventName) {
        var event = control[eventName];

        if (event)
            control[eventName] = function () { };
    }
}

obj4u.Ajax = function () {
    this.event = new obj4u.EventContorller(this);

    this.onLoadSuccess = function (data, xmlhttp) {
        this.data = data;
    }

    this.sync = function (params) {
        if (!params)
            params = {};
        params.async = false;
        this.send(params);
        return this.data;
    }
    this.send = function (params) {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var obj = this;
        xmlhttp.onreadystatechange = function () {

            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

                var ct = xmlhttp.getResponseHeader("content-type");
                var data = xmlhttp.responseText;

                obj.data = eval("(" + data + ")");
                obj.onLoadSuccess(obj.data, xmlhttp);
            }
        }
        var method = "POST";
        if (params.method)
            method = params.method;
        var async = true;
        if (obj4u.HadValue(params.async))
            async = params.async;
        xmlhttp.open(method, params.url, async);

        var contentType = "application/x-www-form-urlencoded";
        if (params.contentType)
            contentType = params.contentType;
        xmlhttp.setRequestHeader("Content-type", contentType);
        xmlhttp.send(params.data);
    }
}

obj4u.Clone = function (obj) {
    if (obj == null || typeof (obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = obj4u.Clone(obj[key]);
    return temp;
}

obj4u.HadValue = function (obj) {
    if (typeof (obj) === 'number')
        return true;
    else if (typeof (obj) === 'string' && obj == "")
        return false;
    else if (obj == null || typeof (obj) == 'undefined')
        return false;
    else
        return true;
}

obj4u.editors = {
    text: function () {
        this.init = function (container, options) {
            var input = document.createElement("input");
            input.type = 'text';
            input.size = 10;
            input.style.width = "100%";
            container.appendChild(input);
            return input;
        }
        this.getValue = function (target) {
            return target.value;
        }
        this.setValue = function (target, value) {
            target.value = value;
        }
        this.resize = function (target, width) {
            target.width = width;
        }
    },
    combo: obj4u.comboBox,
    date: function () {
        this.init = function (container, options) {
            var input = document.createElement("input");
            input.id = container.id + "date";
            input.size = 15;
            container.appendChild(input);
            new datepickr(input.id, {
                'dateFormat': 'm/d/y'
            });
            return input;
        }
        this.getValue = function (target) {
            return target.value;
        }
        this.setValue = function (target, value) {
            target.value = value;
        }
        this.resize = function (target, width) {
            target.width = width;
        }
    }
};