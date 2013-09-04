/*
* oGrid for pure javascript -  v0.5.7
*
* Copyright (c) 2013 watson chen (http://code.google.com/p/obj4u/)
* Dual licensed under the GPL Version 3 licenses.
*
*/
var obj4u = obj4u || {};

obj4u.editors = {
    text: function () {
        this.init = function (container, options) {
            var input = document.createElement("input");
            input.type = 'text';
            input.size = 10;
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
    combo: function () {
        this.init = function (container, options) {
            var select = document.createElement("select");
            for (var i = 0; i < options.length; i++) {
                var opt = new Option(options[i].text, options[i].id);
                select.options.add(opt);
            }
            container.appendChild(select);
            return select;
        }
        this.getValue = function (target) { // return save value
            var val = target.options[target.selectedIndex].value;
            return val;
        }
        this.getText = function (value, options) { // return display text
            var val = value;
            for (var i = 0; i < options.length; i++) {
                if (options[i].id == value) {
                    val = options[i].text;
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
    },
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
            var rowElement = document.getElementById("row" + dataIndex);
            var row = this.rows[dataIndex];
            for (var i in rowElement.children) {
                var cell = rowElement.children[i];
                if (cell.editor) {
                    var val = cell.editor.getValue(cell.editor.control);
                    row[cell.field] = val;
                }
            }
            if (row.state == "insert") {
                this.sendAction("insert", null, row);
                row.state = "none";
            } else
                this.sendAction("update", null, row);

            this.editRow(dataIndex, false);
        }
    }
    this.apply = function () {
        var row;
        if (obj.lastSelectedItem) {
            var dataIndex = obj.lastSelectedIndex;
            row = obj.rows[dataIndex];
            var rowElement = obj.lastSelectedItem;
            if (row.edit) {
                obj.acceptChanges(dataIndex);
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
            var rowElement = document.getElementById("row" + dataIndex);
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

        this.renderRowHead();

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
                    this.sendAction("remove", null, row);
                }
                //this.rows.splice(dataIndex, 1);
                //this.totalRow--;
                //this.resetRowIndex();
                this.refeshPage();
            }
        }
    }
    this.resetRowIndex = function () {
        for (var i = 0; i < this.rows.length; ++i) {
            this.rows[i].index = i;
        }
    }

    this.sendAction = function (action, queryParams, row) {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        queryParams = this.getQryParams(queryParams);

        var obj = this;
        xmlhttp.onreadystatechange = function () {

            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

                var data;
                //var ct = xmlhttp.getResponseHeader("content-type"),
                //        xml = dataType == "xml" || !dataType && ct && ct.indexOf("xml") >= 0,
                //        data = xml ? xmlhttp.responseXML : xmlhttp.responseText;
                var ct = xmlhttp.getResponseHeader("content-type"),
                data = xmlhttp.responseText;
                //if (filter)
                //    data = filter(data, type);

                //if ( type.toLowerCase() == "script" )
                //jQuery.globalEval( data );

                // Get the JavaScript object, if JSON is used.
                //if (dataType.toLowerCase() == "json")
                //    data = eval("(" + data + ")");
                data = eval("(" + data + ")");
                data = obj.onLoadSuccess(data, action);
                obj.loadData(data);
            }
        }

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
            //for (var p in jsonData.rows[0]) {
            //}
            qry = JSON.stringify(row);
        }
        var async = false;
        xmlhttp.open(method, furl, async);

        xmlhttp.setRequestHeader("Content-type", contentType);
        xmlhttp.send(qry);
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
                //this.lastSelectedItem = rowElement;
                //this.lastSelectedIndex = i;
                //this.rows[i].selected = true;
                //rowElement.oldClassName = rowElement.className;
                //rowElement.className = "selected";
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

obj4u.Toolbar = function toolbar(fcontainer, foGrid, params) {
    var objGrid = foGrid;
    this.container = fcontainer;
    this.container.className = "toolbar";
    this.event = new obj4u.EventContorller(this);
    this.buttons = {};

    this.initButton = function () {
        this.buttons.btnEdit = this.addButton("btnEdit", "edit");
        this.buttons.btnApply = this.addButton("btnApply", "apply");
        this.buttons.btnApply.disabled = true;
        this.buttons.btnInsert = this.addButton("btnInsert", "insert");
        this.buttons.btnRemove = this.addButton("btnRemove", "remove");
    }

    this.acceptChanges = function (row) {
        if (row.edit) {
            this.buttons.btnEdit.value = "cancel";
            this.buttons.btnApply.disabled = false;
            this.buttons.btnInsert.disabled = true;
            this.buttons.btnRemove.disabled = true;
        } else {
            this.buttons.btnEdit.value = "edit";
            this.buttons.btnApply.disabled = true;
            this.buttons.btnInsert.disabled = false;
            this.buttons.btnRemove.disabled = false;
        }
    }
    this.addButton = function (id, caption) {
        var obj = this;
        var btn = document.createElement("input");
        btn.type = "button";
        btn.id = id;
        btn.className = "btn";
        btn.value = caption;
        btn.onclick = function () {
            if (obj.onBeforeBtnClick(this)) {
                obj.btnClick(this);
            }
        };
        this.container.appendChild(btn);
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
            objGrid.renderData();
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

obj4u.EventContorller = function EventContorller(fcontrol) {
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

obj4u.Clone = function Clone(obj) {
    if (obj == null || typeof (obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = Clone(obj[key]);
    return temp;
}

obj4u.HadValue = function HadValue(obj) {
    if (typeof (obj) === 'number')
        return true;
    else if (typeof (obj) === 'string' && obj == "")
        return false;
    else if (obj == null || typeof (obj) == 'undefined')
        return false;
    else
        return true;
}