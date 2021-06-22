import { ethers } from 'ethers'
import { getInjectedProvider } from 'web3modal'
import Registry from '../../classes/contracts/Registry'
import DwellerID from '../../classes/contracts/DwellerContract'
import config from '../../config/config'
import Solana, { SolanaWallet } from '../../classes/Solana'
import ServerProgram from '../../classes/contracts/solana/server/server'
import { Keypair, PublicKey } from '@solana/web3.js'
import FriendsProgram, {
  FRIENDS_PROGRAM_ID,
  FRIEND_INFO_SEED
} from '../../classes/contracts/solana/friends/friends'

export default {
  // Checks if a provider has already been selected and connects to it
  async web3Start ({ dispatch, state }) {
    // @ts-ignore
    const solana = this.$app.$solana
    if (state.selectedProvider) {
      if (state.selectedProvider.type === 'injected') {
        dispatch('connectProvider', { providerInfo: state.selectedProvider })
      } else if (state.mnemonic) {
        // const wallet = ethers.Wallet.fromMnemonic(state.mnemonic)
        const wallet: SolanaWallet = await solana.restoreKeypairFromMnemonic(
          state.mnemonic,
          0
        )
        console.log(wallet, wallet.keypair.publicKey.toBase58())
        dispatch('connectProvider', {
          providerInfo: { type: 'satellite' },
          wallet
        })
      }
    }
  },
  async detectInjected ({ commit }) {
    // Get injected provider using web3modal library
    const injectedProvider = getInjectedProvider()

    // Tell the store that we completed our check and we found
    // an injected web3 instance
    commit('setInjectedProvider', injectedProvider)
  },
  async selectProvider ({ commit, dispatch }, { provider }) {
    commit('setSelectedProvider', provider)

    if (provider.type === 'injected') {
      dispatch('connectProvider', { providerInfo: provider })
    }
  },
  async connectProvider ({ commit, dispatch }, { providerInfo, wallet }) {
    // Retrieve the ethereum provider from Vue app
    // @ts-ignore
    const solana: Solana = this.$app.$solana

    const solanaWallet: SolanaWallet = wallet

    await solana.initializeFromSolanaWallet(solanaWallet)

    dispatch('startupActions')

    // // Initialize the ethereum instance with the given provider
    // await ethereum.initialize(providerInfo.type, wallet)

    // // Update the state
    // commit('setWeb3Connected', true)
    // commit('accounts', ethereum.getAccounts())
    // commit('defaultAccount')

    // // Run the startup actions
    // dispatch('startupActions')
    // dispatch('getStats')
  },
  async startupActions ({ commit, state, dispatch }) {
    // @ts-ignore
    const solana: Solana = this.$app.$solana

    const server = new ServerProgram(solana)
    const friends = new FriendsProgram(solana)

    const balance = await solana.getCurrentAccountBalance()

    if (balance === 0) {
      commit('fundingAccount', true)
      const result = await solana.requestAirdrop()
      commit('fundingAccount', false)
    }

    const payerAccount = await solana.getActiveAccount()

    if (!payerAccount) {
      return
    }

    const userPublicKey = await server.getUserPublicKey(payerAccount)

    const userInfo = await server.getUser(userPublicKey)

    console.log('User info', userInfo)

    if (userInfo) {
      commit('profilePictureHash', userInfo.photoHash)
      commit('username', userInfo.name)
    }

    const friendsInfoKey = await solana.generateDerivedPublicKey(
      'friendsInfoKey',
      userPublicKey,
      FRIEND_INFO_SEED,
      FRIENDS_PROGRAM_ID
    )

    console.log('friendsInfoKey', friendsInfoKey?.toBase58())

    const friendInfo = await friends
      .getFriendInfo(friendsInfoKey)
      .catch(e => console.log('no friend info,', e))

    console.log('FriendInfo', friendInfo)

    // if (!userInfo) {
    //   await server.createUser('tumio2')

    //   const userInfoAfter = await server.getUser(userPublicKey)

    //   console.log('User After', userInfoAfter)
    // }

    // console.log('dweller from solana', dweller)

    // const registry = new Registry(
    //   ethereum,
    //   config.registry[config.network.chain]
    // )
    // const dwellerContract = await registry.getDwellerContract(
    //   ethereum.activeAccount
    // )

    // Update the state with the dweller address fetched from the blockchain
    // commit('dwellerAddress', dwellerContract)

    // if (dwellerContract !== '0x0000000000000000000000000000000000000000') {
    //   const dwellerID = new DwellerID(ethereum, dwellerContract)
    //   const dwellerPhoto = await dwellerID.getPhoto()
    //   const dwellerName = await dwellerID.getDwellerName()

    //   // Update the state with user information
    //   commit('profilePictureHash', dwellerPhoto)
    //   commit('username', ethers.utils.parseBytes32String(dwellerName))

    //   // // Dispatch a new action to fetch friends
    //   // dispatch('fetchFriends', state.activeAccount);

    //   // // Dispatch new action to start a listener to new friends requests
    //   // dispatch('startFriendsListeners');
    // }
  },
  async getStats ({ commit }) {
    // @ts-ignore
    const ethereum = this.$app.$ethereum
    // Get stats
    const blockNumber = await ethereum.getBlockNumber()
    const nettype = await ethereum.getNetworkType()

    // Update the state with the retrieved stats
    commit('web3Stats', {
      blockNumber,
      nettype
    })
  }
}
