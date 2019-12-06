<template>
  <el-container v-loading="loading" class="post-article">
    <el-header class="header">
      <el-cascader v-model="cmsDetail.cmsTypeId" :props="defaultParams" :options="options" placeholder="请选择CMS类型" clearable></el-cascader>
      <el-date-picker v-model="cmsDetail.releaseDate" type="date" placeholder="请选择发布日期" style="margin-left: 10px;width: 10%;"></el-date-picker>
      <el-input v-model="cmsDetail.articleSource" placeholder="请输入文章来源" style="width: 300px;margin-left: 10px;margin-right: 10px;">
        <template slot="prepend">文章来源</template>
      </el-input>
      <el-input v-model="cmsDetail.title" placeholder="请输入文章标题" style="width: 400px;margin-left: 10px;margin-right: 10px;">
        <template slot="prepend">文章标题</template>
      </el-input>
      <el-button type="primary" @click="saveBlog()">发表文章</el-button>
    </el-header>
    <div style="padding-top: 5px;background-color: #ECECEC;height: 165px">
      <div style="width:100%;float: left;padding-left: 5px;display:flex;align-items:center;">
        <el-tag style="float: left;">图片：</el-tag>
        <el-upload style="float: left;padding-left: 5px;":class="{hide:hideUpload}" action="string"
                   list-type="picture-card"
                   :file-list="imageFiles"
                   :on-preview="handlePictureCardPreview"
                   :on-change="uploadChange"
                   :http-request="cmsUploadImage"
                   :before-remove="beforeRemove"
                   :on-remove="cmsRemoveImage"
        >
          <i slot="default" class="el-icon-plus"></i>
        </el-upload>
        <el-dialog style="float: left;" :visible.sync="dialogVisible">
          <img width="100%" :src="dialogImageUrl" alt="">
        </el-dialog>
        <el-tag style="float: left;margin-left: 20px;">文章简述：</el-tag>
        <el-input style="float: left;width: 30%;margin-left: 5px;" type="textarea" rows="6" v-model="cmsDetail.remark" placeholder="请输入文章简述"></el-input>
      </div>
    </div>
    <div style="background-color: #ECECEC"><el-divider style="border-bottom: #2c3e50 0.5px dashed;padding-top: 10px;background-color: #ECECEC;"></el-divider></div>
    <div style="background-color: #ECECEC;">
      <div style="width:50%; float: left;">
        <h2>新增文章</h2>
      </div>
      <div style="width:50%; float: left;">
        <h2>预览文章</h2>
      </div>
    </div>
    <el-main class="main">
      <div id="editor">
        <div style="width:50%; float: left;">

          <el-upload
            id="img-upload"
            :multiple="false"
            action="string"
            :before-upload="beforeUpload"
            :http-request="uploadImage"
            :show-file-list="false"
            >
          </el-upload>
          <div id="quill-editor" ref="quill-editor"></div>
          <!-- quill字数统计 -->
          <div class="quill-count">
            <span class="number">{{richCurrentLength}}/{{richMaxLength}}</span>
          </div>
        </div>

        <div style="width:50%; float: left;">
          <div class="ql-editor" v-html="cmsDetail.contentHtml"></div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>
<script>
  import {postRequestJson, putRequestJson, uploadFileRequest} from '../utils/api'
  import {getRequest} from '../utils/api'
  // Local Registration
  import {isNotNullORBlank} from '../utils/utils'

  import Quill from 'quill'
  import ImageResize from 'quill-image-resize-module'
  import { ImageDrop } from 'quill-image-drop-module'

  Quill.register('modules/imageResize', ImageResize)
  Quill.register('modules/imageDrop', ImageDrop)

  export default {
    mounted: function () {
      this.getCategories();
      let query = this.$route.query;
      let _this = this;
      if (query && query.id) {
        this.loading = true;
        getRequest("/cms/" + query.id).then(resp=> {
          _this.loading = false;
          if (resp && resp.status == 200) {
            _this.cmsDetail = resp.data.data.cmsDetail;
            _this.imageUrls = resp.data.data.imageUrls;
            if(_this.imageUrls && _this.imageUrls.length > 0){
              for (let i = 0; i < _this.imageUrls.length; i++) {
                _this.imageFiles.push({"url": _this.imageUrls[i]});
              }
            }
            // 获取富文本内容
            document.querySelector('#quill-editor').children[0].innerHTML = _this.cmsDetail.contentHtml
          } else {
            _this.$message({type: 'error', message: '页面加载失败!'})
          }
        }, resp=> {
          _this.loading = false;
          _this.$message({type: 'error', message: '页面加载失败!'})
        })
      }

      this.initQuill();

    },
    components: {
    },
    methods: {
      saveBlog(){
        if (!(isNotNullORBlank(this.cmsDetail.title, this.cmsDetail.contentHtml, this.cmsDetail.cmsTypeId))) {
          this.$message({type: 'error', message: '数据不能为空!'});
          return;
        }
        let _this = this;
        _this.loading = true;
        if(_this.cmsDetail.id && _this.cmsDetail.id > 0){
          putRequestJson("/cms/", {cmsDetail: _this.cmsDetail, imageUrls: _this.imageUrls}).then(resp=> {
            _this.loading = false;
            if (resp && resp.status == 200 && resp.data.status == 'success') {
              window.bus.$emit('blogTableReload')
              _this.$router.replace({path: '/articleList'});
            }
          }, resp=> {
            _this.loading = false;
          })
        } else {
          _this.cmsDetail.id = null;
          postRequestJson("/cms/", {cmsDetail: _this.cmsDetail, imageUrls: _this.imageUrls}).then(resp=> {
            _this.loading = false;
            if (resp && resp.status == 200 && resp.data.status == 'success') {
              window.bus.$emit('blogTableReload')
              _this.$router.replace({path: '/articleList'});
            }
          }, resp=> {
            _this.loading = false;
          })
        }
      },
      getCategories(){
        let _this = this;
        getRequest("/admin/cms/cascader").then(resp=> {
          this.options = resp.data.data;
        });
      },


      onEditorChange(eventName, ...args) {
        if(eventName === 'text-change') {
          // 获取富文本内容
          this.cmsDetail.contentHtml = document.querySelector('#quill-editor').children[0].innerHTML
        } else if (eventName === 'selection-change') {
          // args[0] will be old range
        }
      },
      // 初始化自定义的quill工具栏
      // 拿到quill实例以后，在执行自定义toolbar的操作
      initCustomQullToolbar() {
        const timeButton = document.querySelector('.ql-custom')
        timeButton.style.cssText = 'width: 80px; outline: none;'
        timeButton.innerText = '自定义'
      },
      // 给自定义的按钮功能加上方法
      quillCustomFunction() {
        const h = this.$createElement
        this.$notify({
          type: 'success',
          title: '自定义一个quill功能',
          message: h('i', {style: 'color: teal'}, '可不可以让我自定义一个 Quill 的功能？可不可以让我自定义一个 Quill 的功能？')
        })
      },
      initQuill() {
        const quill = new Quill('#quill-editor', {
          // 编辑器配置选项
          theme: 'snow',
          placeholder: 'Compose an epic...',
          debug: 'error',
          modules: {
            toolbar: {
              container: this.$options.toolbarOptions,
              handlers: {  // 自定义功能
                'image': this.$options.imageFunction,
                'custom': this.quillCustomFunction
              }
            },
            imageDrop: true,
            imageResize: {
              modules: ['Resize', 'DisplaySize', 'Toolbar'],
              handleStyles: {
                backgroundColor: 'black',
                border: 'none',
                color: 'white'
              },
              displayStyles: {
                backgroundColor: 'black',
                border: 'none',
                color: 'white'
              },
              toolbarStyles: {
                backgroundColor: 'black',
                border: 'none',
                color: 'white'
              },
              toolbarButtonStyles: {},
              toolbarButtonSvgStyles: {}
            }
          }
        })
        this.quill = quill
        // 拿到quill实例以后，在执行自定义toolbar的操作
        this.initCustomQullToolbar()
        /**
         * 监听富文本变化
         * editor-change 包括 text-change、selection-change
         * 你也可以分别监听 text-change 和 selection-change
         * 文档：https://quilljs.com/docs/api/#text-change
         */
        quill.on('editor-change', this.onEditorChange)
      },
      handlePictureCardPreview(file) {
        this.dialogImageUrl = file.url;
        this.dialogVisible = true;
      },
      beforeUpload(file) {
        let fileName = file.name;
        let regex = /(.jpg|.jpeg|.gif|.png|.bmp)$/;
        if (regex.test(fileName.toLowerCase())) {
          console.log("图片文件", fileName)
        } else {
          this.$message.error('请选择图片文件');
        }
      },


      // 富文本中的图片上传
      uploadImage(param){
        let fd = new FormData();
        fd.append('file', param.file); // 要提交给后台的文件
        uploadFileRequest("/admin/cms/upload", fd).then(resp => { // UploadFiles 是封装的接口
          /**
           * 如果上传成功
           * ps：不同的上传接口，判断是否成功的标志也不一样，需要看后端的返回
           * 通常情况下，应该有返回上传的结果状态（是否上传成功）
           * 以及，图片上传成功后的路径
           * 将路径赋值给 imgUrl
           */
          if(resp.data.data) {
            let imgUrl = resp.data.data;
            // 获取光标所在位置
            let length = this.quill.getSelection().index;
            // 插入图片，res为服务器返回的图片链接地址
            this.quill.insertEmbed(length, 'image', imgUrl);
            // 调整光标到最后
            this.quill.setSelection(length + 1)
          }
        })
      },

      // 文章图片上传
      cmsUploadImage(param){
        let _this = this;
        let fd = new FormData();
        fd.append('file', param.file); // 要提交给后台的文件
        _this.loading = true;
        uploadFileRequest("/admin/cms/upload/" + this.cmsDetail.id, fd).then(resp => { // UploadFiles 是封装的接口
            /**
             * 如果上传成功
             * ps：不同的上传接口，判断是否成功的标志也不一样，需要看后端的返回
             * 通常情况下，应该有返回上传的结果状态（是否上传成功）
             * 以及，图片上传成功后的路径
             * 将路径赋值给 imgUrl
             */
            if(resp.data.data) {
                // 上传后的服务器图片路径
                let imgUrl = resp.data.data;
                _this.imageUrls.push(imgUrl);
                _this.imageFiles.push({"url": imgUrl});
            }
        })
        setTimeout(function () {
          _this.loading = false;
        }, 1000)
      },

      beforeRemove(file, fileList){
        if (confirm('图片删除后不可恢复，确定删除吗?')) {
          let _this = this;
          _this.loading = true;
          return true;
        } else {
          return false;
        }
      },
      // 文章图片删除
      cmsRemoveImage(file, fileList){
        let _this = this;
        getRequest("/admin/cms/remove/" + this.cmsDetail.id, {"imageUrl": file.url}).then(resp => {
          if(resp.data.status === 200) {
            _this.imageFiles = [];
            _this.imageUrls = [];
            fileList.forEach(item => {
              _this.imageUrls.push(item.url);
              _this.imageFiles.push({"url": item.url});
            });
            _this.hideUpload = fileList.length >= this.limitCount;
          }
        })
        setTimeout(function () {
          _this.loading = false;
        }, 1500)
      },
      uploadChange(file, fileList){
        this.hideUpload = fileList.length >= this.limitCount;
      }
    },
    data() {
      return {
        options: [],
        editId: '',
        // cms类型父id
        parentId: '',
        loading: false,
        cmsDetail: {
            id: '',
            title: '',
            remark: '',
            releaseDate: '',
            articleSource: '',
            contentHtml: '',
            imgUrls: '',
            cmsTypeId: ''
        },
        imageUrls: [],
        imageFiles:[],
        defaultParams: {
          label: 'name',
          value: 'id',
          children: 'children',
          emitPath: false
        },

        // ================富文本属性======================
        // 最大字数
        richMaxLength: 999999999,
        richCurrentLength: 0,

        // ================上传图片属性======================
        dialogImageUrl: '',
        dialogVisible: false,
        hideUpload: false,
        // 上传图片最大限制
        limitCount: 4
      }
    },

    // 富文本工具栏配置
    toolbarOptions: [
      [{ 'size': ['small', false, 'large', 'huge'] }], // 字体大小
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],     // 几级标题
      ['bold', 'italic', 'underline', 'strike'],    // 加粗，斜体，下划线，删除线
      [{ 'indent': '-1' }, { 'indent': '+1' }],     // 缩进
      [{ 'color': [] }, { 'background': [] }],     // 字体颜色，字体背景颜色
      [{ 'align': [] }],    // 对齐方式
      ['clean'],    // 清除字体样式
      ['image'],
      ['custom']  // 添加一个自定义功能
    ],
    // 自定义富文本的图片上传
    imageFunction(val) {
      if(val) {
        document.querySelector('#img-upload input').click()
      } else {
        this.quill.format('image', false)
      }
    },
    watch: {
      content() {
        // 富文本内容长度
        this.richCurrentLength = this.quill.getLength() - 1
        let numWrapper = document.querySelector('.quill-count')
        if(this.richCurrentLength > this.richMaxLength) {
          numWrapper.style.color = 'red'
        } else {
          numWrapper.style.color = '#666'
        }
      }
    },
    beforeDestroy() {
      this.quill = null
      delete this.quill
    }
  }
</script>
<style>
  .post-article > .main > #editor {
    width: 100%;
    height: 450px;
    text-align: left;
  }

  .post-article > .header {
    background-color: #ececec;
    margin-top: 10px;
    padding-left: 5px;
    display: flex;
    justify-content: flex-start;
  }

  .post-article > .main {
    /*justify-content: flex-start;*/
    display: flex;
    flex-direction: column;
    padding-left: 5px;
    background-color: #ececec;
    padding-top: 0px;
  }

  .post-article > .header > .el-tag + .el-tag {
    margin-left: 10px;
  }

  .post-article > .header > .button-new-tag {
    margin-left: 10px;
    height: 32px;
    line-height: 30px;
    padding-top: 0;
    padding-bottom: 0;
  }

  .post-article > .header > .input-new-tag {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
  }

  .post-article {
  }
  .main-container {
    max-width: 80%;
    min-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  .tips {
    width: 600px;
    padding: 15px 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    line-height: 2;
  }
  .font {
    font-size: 18px;
  }
  #quill-editor {
    /*width: 80%;*/
    height: 800px;
  }
  /*字数统计*/
  .quill-count {
    border: 1px solid #ccc;
    border-top: none;
    height: 30px;
    line-height: 30px;
    text-align: right;
    padding-right: 10px;
    font-size: 14px;
    color: #666;
  }
  /* 内容返显 */
  .ql-editor {
    margin-bottom: 50px;
  }
  .el-container.post-article.is-vertical {
    height: 800px;
  }

  .hide .el-upload--picture-card {
    display: none;
  }
</style>
