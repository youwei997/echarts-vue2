import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import * as echarts from 'echarts';
import axios from 'axios';

import '../public/static/theme/chalk'

import '@/assets/css/global.less'; //@代表src ,全局样式
import '@/assets/font/iconfont.css'

axios.defaults.baseURL = 'http://127.0.0.1:8888/api/'

Vue.prototype.$axios = axios; //添加axios到Vue的原型对象上
Vue.prototype.$echarts = echarts;


Vue.config.productionTip = false

// console.log(new Vue);
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

