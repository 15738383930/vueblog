<template>
	<span v-loading="loading" class="tree-expand">
		<span class="tree-label" v-show="DATA.isEdit">
<!--                @blur.stop="nodeEditPass(STORE,DATA,NODE)"-->
			<el-input class="edit" size="mini" autofocus
                v-model="DATA.name"
                :ref="'treeInput'+DATA.id"
                @click.stop.native="nodeEditFocus"
                @keyup.enter.stop.native="nodeEditPass(STORE,DATA,NODE)" placeholder="节点名称"></el-input>
			<i class="el-icon-check" style="color: mediumseagreen" @click.stop="nodeEditPass(STORE,DATA,NODE)"></i>
			<i class="el-icon-close" style="color: red" @click.stop="nodeEditClose(STORE,DATA,NODE)"></i>
		</span>
		<span v-show="!DATA.isEdit"
          :class="[DATA.id > maxexpandId ? 'tree-new tree-label' : 'tree-label']">
			<span>{{DATA.name}}</span>
		</span>
		<span class="tree-btn" v-show="!DATA.isEdit">
			<i class="el-icon-plus" @click.stop="nodeAdd(STORE,DATA,NODE)"></i>
			<i class="el-icon-edit" @click.stop="nodeEdit(STORE,DATA,NODE)"></i>
			<i class="el-icon-delete" @click.stop="nodeDel(STORE,DATA,NODE)"></i>
		</span>
	</span>
</template>

<script>
    import {getRequest, postRequest, putRequestJson} from "../utils/api";

  export default{
    name: 'treeExpand',
    props: ['NODE', 'DATA', 'STORE', 'maxexpandId'],
    methods: {
      nodeAdd(s,d,n){//新增
        this.$emit('nodeAdd',s,d,n)
      },
      nodeEdit(s,d,n){//编辑
        d.isEdit = true;
        this.lodName = d.name;
        this.$nextTick(() => {
          this.$refs['treeInput'+d.id].$refs.input.focus()
        })
        this.$emit('nodeEdit',s,d,n)
      },
      nodeDel(s,d,n){//删除
        this.$emit('nodeDel',s,d,n)
      },
      //编辑完成
      nodeEditPass(s,d,n){
          let _this = this;
          let dd = JSON.parse(JSON.stringify(d));
          dd.children = [];
          _this.loading = true;
          if(d.name){
              getRequest('/cms/cmsType/isItUnique', dd).then(resp=> {
                  if (resp.status === 200 && resp.data.status === 200) {
                      if(d.id && d.id > 0){
                          putRequestJson('/admin/cms/cmsType', dd).then(resp=> {
                              _this.loading = false;
                              if (resp.status === 200 && resp.data.status === 'success') {
                                  _this.$message({type: 'success', message: resp.data.msg});
                                  d.isEdit = false;
                              }else{
                                  _this.$message({type: 'error', message: resp.data.msg});
                              }
                          }, resp=> {
                              _this.loading = false;
                              _this.$message({type: 'error', message: resp.data.msg});
                          })
                      }else{
                          postRequest('/admin/cms/cmsType', dd).then(resp=> {
                              _this.loading = false;
                              if (resp.status === 200 && resp.data.status === 200) {
                                  d.id = resp.data.data;
                                  _this.$message({type: 'success', message: resp.data.msg});
                                  d.isEdit = false;
                              }else{
                                  _this.$message({type: 'error', message: resp.data.msg});
                              }
                          }, resp=> {
                              _this.loading = false;
                              _this.$message({type: 'error', message: resp.data.msg});
                          })
                      }
                  }else{
                      _this.loading = false;
                      _this.$message({type: 'error', message: resp.data.msg});
                  }
              }, resp=> {
                  _this.loading = false;
                  _this.$message({type: 'error', message: resp.data.msg});
              })
          }else{
              _this.loading = false;
              _this.$message({type: 'error', message: '请输入节点名称'});
          }
      },
      // 取消编辑
      nodeEditClose(s,d,n){
          if(d.id && d.id > 0){
              d.isEdit = false;
              d.name = this.lodName;
          }else{
              this.$emit('nodeDel',s,d,n)
          }
      },
      nodeEditFocus(){
        //阻止点击节点的事件冒泡
      }
    },
    data(){
        return {
            loading: false,
            lodName: ''
        };
    }
  }
</script>

<style>
  .tree-expand{
    overflow:hidden;
  }
  .tree-expand .tree-label.tree-new{
    font-weight:600;
  }
  .tree-expand .tree-label{
    font-size:0.9em;
  }
  .tree-expand .tree-label .edit{
    width:80%;
  }
  .tree-expand .tree-btn{
    display:none;
    float:right;
    margin-right:20px;
  }
  .tree-expand .tree-btn i{
    color:#8492a6;
    font-size:0.9em;
    margin-right:3px;
  }
  .tree-expand .tree-btn> i:first-child {
    margin-left:40%;
  }
</style>
