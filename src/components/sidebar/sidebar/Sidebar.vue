<template src="./Sidebar.html"></template>

<script>
// import config from '@/config/config';
import ServerList from '@/components/sidebar/serverlist/ServerList'
import QuickFriends from '@/components/sidebar/quickfriends/QuickFriends'
import User from '@/components/sidebar/user/User'
import Controls from '@/components/sidebar/controls/Controls'
import Package from '../../../../package.json'
import MobileNav from '@/components/sidebar/mobilenav/MobileNav'
import ServerSlider from '@/components/sidebar/serverslider/ServerSlider'
import UpdateCheck from '@/components/common/UpdateCheck'
import Groups from '@/components/sidebar/groups/Groups'

import MobileUtils from '@/utils/Mobile.ts'

// Servers
import ServerSidebar from '@/components/server/sidebar/Sidebar'

export default {
  name: 'Sidebar',
  props: ['toggleSettings', 'toggleCreateServer', 'loadingServers', 'servers'],
  components: {
    ServerList,
    User,
    Controls,
    QuickFriends,
    ServerSidebar,
    MobileNav,
    ServerSlider,
    UpdateCheck,
    Groups
  },
  data () {
    return {
      route: 'chats',
      showQuickFriends: false,
      version: Package.version,
      requiresUpdate: false,
      tabRoute: this.$store.state.group ?
        'groups' : 'chats'
    }
  },
  mounted () {
    // this.updateServers();
  },
  methods: {
    getTabClass (forTab) {
      return forTab === this.tabRoute
        ? 'button is-small is-primary is-selected'
        : 'button is-small is-black'
    },
    setTabClass (route) {
      this.tabRoute = route
    },
    onClickClose () {
      this.$nextTick(() => {
        setTimeout(() => {
          this.$store.commit('setMobileSidebar', false)
        }, 0)
      })
    },
    getFriend (friends, address) {
      return friends.filter(f => f.address === address)[0]
    },

    isUnread (address) {
      return this.$store.state.unreads.includes(address)
    },
    toggleQuickFriends () {
      this.showQuickFriends = !this.showQuickFriends
    },
    setRoute (route) {
      this.route = route
    },
    setMainRoute (route) {
      this.$store.commit('changeRoute', route)
    },
    // Returns if user device is mobile
    isMobile: MobileUtils.isMobile,
    swipeHandler (direction) {
      if (this.isMobile()) {
        if (direction === 'left') {
          this.$store.commit('setMobileSidebar', false)
          this.$store.commit('changeRoute', 'main')
        }
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less" src="./Sidebar.less"></style>
