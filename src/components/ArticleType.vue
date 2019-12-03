<template>
  <div class="expand">
    <div>
      <el-button @click="handleAddTop">添加顶级节点</el-button>
      <el-tree ref="expandMenuList" class="expand-tree"
               v-if="isLoadingTree"
               :data="setTree"
               node-key="id"
               highlight-current
               :props="defaultProps"
               :expand-on-click-node="false"
               :render-content="renderContent"
               :default-expanded-keys="defaultExpandKeys"
               ></el-tree>
<!--      @node-click="handleNodeClick"-->
    </div>
  </div>
</template>
<!-- VUE饿了么树形控件添加增删改功能按钮 -->
<script>
  import TreeRender from './ArticleTypeTreeRender'
  import {deleteRequest, getRequest} from "../utils/api";

  let id = 1000;

  export default{
    name: 'tree',
    data(){
      return{
        setTree: [],  //节点树数据
        maxexpandId: id,//新增节点开始id
        non_maxexpandId: id,//新增节点开始id(不更改)
        isLoadingTree: false,//是否加载节点树
        defaultProps: {
          label: 'name',
          id: 'id',
          children: 'children',
        },
        defaultExpandKeys: [],//默认展开节点列表
      }
    },
    mounted(){
      this.initExpand();

      this.getCategories();
    },
    methods: {
      initExpand(){
        this.setTree.map((a) => {
          this.defaultExpandKeys.push(a.id)
        });
        this.isLoadingTree = true;
      },
      handleNodeClick(d,n,s){//点击节点
        // console.log(d,n)
        d.isEdit = false;//放弃编辑状态
      },
      getCategories(){
        let _this = this;
        getRequest("/admin/cms/cascader").then(resp=> {
            if(resp.data){
                _this.setTree = JSON.parse(JSON.stringify(resp.data.data));
            }
        });
      },
      renderContent(h,{node,data,store}){//加载节点
        let that = this;
        return h(TreeRender,{
          props: {
            DATA: data,
            NODE: node,
            STORE: store,
            maxexpandId: that.non_maxexpandId
          },
          on: {
            nodeAdd: ((s,d,n) => that.handleAdd(s,d,n)),
            nodeEdit: ((s,d,n) => that.handleEdit(s,d,n)),
            nodeDel: ((s,d,n) => that.handleDelete(s,d,n))
          }
        });
      },
      handleAddTop(){
        this.setTree.push({
          id: '',
          name: '',
          parentId: '',
          isEdit: true,
          children: []
        })
      },
      handleAdd(s,d,n){//增加节点
        if(n.level >=2){
          this.$message.error("最多只支持两级！")
          return false;
        }
        //添加数据
        d.children.push({
          id: '',
          name: '',
          parentId: d.id,
          isEdit: true,
          children: []
        });
        //展开节点
        if(!n.expanded){
          n.expanded = true;
        }
      },
      handleEdit(s,d,n){//编辑节点
      },
      handleDelete(s,d,n){//删除节点
        let that = this;
        //有子级不删除
        if(d.children && d.children.length !== 0){
          this.$message.error("此节点有子级，不可删除！")
          return false;
        }else{
          //新增节点直接删除，否则要询问是否删除
          let delNode = () => {
              let list = n.parent.data.children || n.parent.data,//节点同级数据
                  _index = 99999;//要删除的index
              /*if(!n.parent.data.children){//删除顶级节点，无children
                list = n.parent.data
              }*/
              list.map((c,i) => {
                  if(d.id === c.id){
                      _index = i;
                  }
              })
              let k = list.splice(_index, 1);
              this.$message.success("删除成功！")
          };
          let isDel = () => {
            that.$confirm("是否删除此节点？","提示",{
              confirmButtonText: "确认",
              cancelButtonText: "取消",
              type: "warning"
            }).then(() => {
                deleteRequest("/admin/cms/cmsType/" + d.id).then(resp=> {
                    if (resp.status === 200 && resp.data.status === 200) {
                        delNode();
                    }
                })
            }).catch(() => {
              return false;
            })
          }
          //判断是否新增
          !d.id ? delNode() : isDel()
        }
      },
    }

  }
</script>

<style>
  .expand{
    width:100%;
    height:80%;
    overflow:hidden;
  }
  .expand>div{
    height:85%;
    padding-top:20px;
    width:50%;
    margin:20px auto;
    max-width:800px;
    overflow-y:auto;
  }
  .expand>div::-webkit-scrollbar-track{
    box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    border-radius:5px;
  }
  .expand>div::-webkit-scrollbar-thumb{
    background-color:rgba(50, 65, 87, 0.5);
    outline:1px solid slategrey;
    border-radius:5px;
    float: right;
  }
  .expand>div::-webkit-scrollbar{
    width:10px;
  }
  .expand-tree{
    border:none;
    margin-top:10px;
  }
  .expand-tree .el-tree-node.is-current,
  .expand-tree .el-tree-node:hover{
    overflow:hidden;
  }
  .expand-tree .is-current>.el-tree-node__content .tree-btn,
  .expand-tree .el-tree-node__content:hover .tree-btn{
    display:inline-block;
  }
  .expand-tree .is-current>.el-tree-node__content .tree-label{
    font-weight:600;
    white-space:normal;
  }
</style>
