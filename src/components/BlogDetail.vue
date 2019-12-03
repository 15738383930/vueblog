<template>
  <el-row v-loading="loading">
    <el-col :span="24">
      <div style="text-align: left;">
        <el-button type="text" icon="el-icon-back" @click="goBack" style="padding-bottom: 0px;">返回</el-button>
      </div>
    </el-col>
    <el-col :span="24">
      <div>
        <div><h3 style="margin-top: 0px;margin-bottom: 0px">{{cms.title}}</h3></div>
        <div style="width: 100%;margin-top: 5px;display: flex;justify-content: flex-end;align-items: center">
          <div style="display: inline; color: #20a0ff;margin-left: 50px;margin-right:20px;font-size: 12px;">
            {{cms.articleSource}}
          </div>
          <span style="color: #20a0ff;margin-right:20px;font-size: 12px;">浏览 {{cms.views}}</span>
          <span style="color: #20a0ff;margin-right:20px;font-size: 12px;"> {{cms.releaseDate | formatDate}}</span>
          <!--<el-tag type="success" v-for="(item,index) in article.tags" :key="index" size="small"
                  style="margin-left: 8px">{{item.tagName}}
          </el-tag>-->
          <span style="margin:0px 50px 0px 0px"></span>
        </div>
      </div>
    </el-col>
    <el-col>
      <div style="text-align: left" v-html="cms.contentHtml">
      </div>
    </el-col>
  </el-row>
</template>
<script>
  import {getRequest} from '../utils/api'
  export default{
    methods: {
      goBack(){
        this.$router.go(-1);
      }
    },
    mounted: function () {
      let id = this.$route.query.id;
      let _this = this;
      this.loading = true;
      getRequest("/cms/" + id).then(resp=> {
        if (resp && resp.status == 200) {
          _this.cms = resp.data.data.cmsDetail;
        }
        _this.loading = false;
      });
    },
    data(){
      return {
        cms: {},
        loading: false
      }
    }
  }
</script>
