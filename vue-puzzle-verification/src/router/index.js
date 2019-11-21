import Vue from 'vue'
import Router from 'vue-router'
import Demo from '@/components/demo'
import MyDemo from '@/views/MyDemo'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/mydemo'
    },
    {
      path: '/demo',
      name: 'demo',
      component: Demo
    },
    {
      path: '/mydemo',
      name: 'mydemo',
      component: MyDemo
    }
  ]
})
