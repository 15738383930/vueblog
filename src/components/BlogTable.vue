<style type="text/css">
  .blog_table_footer {
    display: flex;
    box-sizing: content-box;
    padding-top: 10px;
    padding-bottom: 0px;
    margin-bottom: 0px;
    justify-content: space-between;
  }
</style>
<template>
  <div>
    <div style="display: flex;justify-content: flex-start">
      <el-input
        placeholder="通过标题搜索该分类下的CMS..."
        prefix-icon="el-icon-search"
        v-model.trim="keywords" style="width: 400px" size="mini">
      </el-input>
      <el-button type="primary" icon="el-icon-search" size="mini" style="margin-left: 3px" @click="searchClick">搜索
      </el-button>
    </div>
    <el-table
      ref="multipleTable"
      :data="cmss"
      tooltip-effect="dark"
      style="width: 100%;overflow-x: hidden; overflow-y: hidden;"
      max-height="390"
      @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column
        type="selection"
        width="35" align="left" v-if="showEdit || showDelete">
      </el-table-column>
      <el-table-column
        label="标题"
        width="400" align="left">
        <template slot-scope="scope"><span style="color: #409eff;cursor: pointer" @click="itemClick(scope.row)">{{ scope.row.title}}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="发布时间" width="140" align="left">
        <template slot-scope="scope">{{ scope.row.releaseDate | formatDate}}</template>
      </el-table-column>
      <el-table-column
        prop="nickname"
        label="文章来源"
        width="120" align="left">
        <template slot-scope="scope">{{ scope.row.articleSource}}</template>
      </el-table-column>
      <el-table-column
        prop="cmsTypeName"
        label="所属分类"
        width="120" align="left">
        <template slot-scope="scope" >{{ scope.row.cmsTypeName }}</template>
      </el-table-column>
      <el-table-column label="操作" align="left" v-if="showEdit || showDelete">
        <template slot-scope="scope">
          <el-button
            size="mini"
            @click="handleEdit(scope.$index, scope.row)" v-if="showEdit">编辑
          </el-button>
          <el-button
            size="mini"
            @click="handleRestore(scope.$index, scope.row)" v-if="showRestore">还原
          </el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(scope.$index, scope.row)" v-if="showDelete">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="blog_table_footer">
      <el-button type="danger" size="mini" style="margin: 0px;" v-show="this.cmss.length>0 && showDelete"
                 :disabled="this.selItems.length==0" @click="deleteMany">批量删除
      </el-button>
      <span></span>
      <el-pagination
        background
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="totalCount" @current-change="currentChange" v-show="this.cmss.length>0">
      </el-pagination>
    </div>
  </div>
</template>

<script>
  import {putRequest} from '../utils/api'
  import {getRequest} from '../utils/api'
//  import Vue from 'vue'
//  var bus = new Vue()

  export default{
    data() {
      return {
        cmsTypeParents: [],
        cmss: [],
        selItems: [],
        loading: false,
        currentPage: 1,
        totalCount: -1,
        pageSize: 6,
        keywords: '',
        dustbinData: []
      }
    },
    mounted: function () {
      var _this = this;
      this.loading = true;
      this.loadBlogs(1, this.pageSize);
      window.bus.$on('blogTableReload', function () {
        _this.loading = true;
        _this.loadBlogs(_this.currentPage, _this.pageSize);
      })
    },
    methods: {
      searchClick(){
        this.loadBlogs(1, this.pageSize);
      },
      itemClick(row){
        this.$router.push({path: '/blogDetail', query: {id: row.id}})
      },
      deleteMany(){
        let _this = this;
        var selItems = _this.selItems;
        for (var i = 0; i < selItems.length; i++) {
          _this.dustbinData.push(selItems[i].id)
        }
        _this.deleteToDustBin(_this.state)
      },
      //翻页
      currentChange(currentPage){
        this.currentPage = currentPage;
        this.loading = true;
        this.loadBlogs(currentPage, this.pageSize);
      },
      loadBlogs(page, count){
        let _this = this;
        getRequest("/cms/all", {"keywords":this.keywords, "state": _this.state, "pageNum":page, "pageSize":count}).then(resp=> {
          _this.loading = false;
          if (resp && resp.status == 200) {
            _this.cmss = resp.data.data.list;
            _this.totalCount = resp.data.data.total;
          }
        })
      },
      handleSelectionChange(val) {
        this.selItems = val;
      },
      handleEdit(index, row) {
        this.$router.push({path: '/editBlog', query: {id: row.id}});
      },
      handleDelete(index, row) {
        this.dustbinData.push(row.id);
        this.deleteToDustBin(this.state);
      },
      handleRestore(index, row) {
        let _this = this;
        this.$confirm('将该文件还原到原处，是否继续？','提示',{
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        } ).then(() => {
          _this.loading = true;
          putRequest('/admin/cms/' + row.id).then(resp=> {
            if (resp && resp.status == 200 && resp.data.status == 'success') {
              window.bus.$emit('blogTableReload')//通过选项卡都重新加载数据
            } else {
              _this.$message({type: 'error', message: '还原失败!'});
            }
            _this.loading = false;
          });
        })
      },
      deleteToDustBin(state){
        var _this = this;
        this.$confirm(state != 2 ? '将该文件放入回收站，是否继续?' : '永久删除该文件, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          _this.loading = true;
          putRequest("/admin/cms/batch", {ids: _this.dustbinData, state: state}).then(resp=> {
            if (resp && resp.status == 200 && resp.data.status == 'success') {
              window.bus.$emit('blogTableReload')//通过选项卡都重新加载数据
            }
            _this.loading = false;
            _this.dustbinData = []
          }, resp=> {
            _this.loading = false;
            _this.dustbinData = []
          });
        }).catch(() => {
          _this.$message({
            type: 'info',
            message: '已取消删除'
          });
          _this.dustbinData = [];
          _this.loading = false;
        });
      }
    },
    props: ['state', 'showEdit', 'showDelete', 'activeName', 'showRestore']
  }
</script>
