<template>
  <div class="h-screen flex flex-col bg-white overflow-hidden font-mono">
    
    <!-- View: List -->
    <SnippetList 
      v-if="currentView === 'list'"
      :snippets="snippets"
      @create="createNew"
      @open="openSnippet"
    />

    <!-- View: Editor -->
    <SnippetEditor 
      v-else-if="currentView === 'editor'"
      :snippet="currentSnippet"
      @update:snippet="updateCurrentSnippet"
      @back="goBack"
      @save="saveSnippet"
      @run="runCode"
      @delete="deleteSnippet"
    />

    <!-- View: Settings -->
    <Settings 
      v-else-if="currentView === 'settings'"
      @back="goBack"
    />

    <!-- Global Footer / Navigation -->
    <div v-if="currentView === 'list'" class="border-t-2 border-black p-2 bg-gray-50 flex justify-between items-center text-xs">
      <div>Errors: 0</div>
      <el-button size="small" @click="currentView = 'settings'">
        [CONFIG]
      </el-button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/logic/storage'
import { runSnippet as executeSnippet } from '@/logic/runner'
import SnippetList from '@/components/SnippetList.vue'
import SnippetEditor from '@/components/SnippetEditor.vue'
import Settings from '@/components/Settings.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const snippets = ref([])
const currentView = ref('list') // list, editor, settings
const currentSnippet = ref({})

const loadSnippets = async () => {
  snippets.value = await db.snippets.toArray()
}

const createNew = () => {
  currentSnippet.value = {
    uuid: crypto.randomUUID(),
    title: 'New_Polymorph',
    content: '<!-- Wired_Frame -->\n<h1>Hello World</h1>',
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  currentView.value = 'editor'
}

const openSnippet = (snippet) => {
  currentSnippet.value = { ...snippet } // clone
  currentView.value = 'editor'
}

const updateCurrentSnippet = (val) => {
    currentSnippet.value = val
}

const goBack = () => {
  currentView.value = 'list'
  loadSnippets() // Refresh list on back
}

const saveSnippet = async (snippetData) => {
  try {
    const plainSnippet = JSON.parse(JSON.stringify(snippetData))
    plainSnippet.updatedAt = Date.now()
    
    if (plainSnippet.id) {
      await db.snippets.update(plainSnippet.id, plainSnippet)
    } else {
      delete plainSnippet.id 
      await db.snippets.add(plainSnippet)
      // After add, reload to get ID if needed, but we usually go back or keep editing
    }
    await loadSnippets()
    ElMessage.success({
        message: 'SEQUENCE_SAVED',
        offset: 40,
        plain: true,
    })
  } catch (err) {
    console.error(err)
    ElMessage.error('SAVE_FAILED')
  }
}

const deleteSnippet = async (snippetData) => {
    try {
        await ElMessageBox.confirm('DELETE_THIS_SEQUENCE?', 'WARNING', {
            confirmButtonText: 'CONFIRM',
            cancelButtonText: 'CANCEL',
            type: 'warning',
            roundButton: false
        })
        
        if (snippetData.id) {
            await db.snippets.delete(snippetData.id)
            await loadSnippets()
            currentView.value = 'list'
            ElMessage.success('DELETED')
        }
    } catch (e) {
        // Cancelled
    }
}

const runCode = (code) => {
  try {
    executeSnippet(code)
  } catch (err) {
    console.error(err)
    ElMessage.error('EXECUTION_ERROR')
  }
}

onMounted(loadSnippets)

</script>

<style>
/* Global overrides if needed, but index.css handles most */
</style>
