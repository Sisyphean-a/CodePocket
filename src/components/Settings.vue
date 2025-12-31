<template>
  <div class="h-full flex flex-col p-4">
    <div class="font-bold text-xl mb-6 tracking-tighter border-b-2 border-black pb-2">
      SETTINGS_
    </div>

    <div class="space-y-6">
      <!-- GitHub Token -->
      <div class="space-y-2">
        <label class="block font-bold text-xs uppercase tracking-wider">GitHub Personal Access Token</label>
        <div class="text-xs text-gray-500 mb-1">REQUIRED FOR GIST SYNC</div>
        <input 
          v-model="settings.githubToken"
          type="password"
          class="w-full wired-input font-mono text-sm"
          placeholder="ghp_..."
        />
      </div>

      <!-- Sync Actions -->
      <div class="border-2 border-black p-4 bg-gray-50">
        <div class="font-bold mb-2">[CLOUD_SYNC]</div>
        <div class="grid grid-cols-2 gap-4">
            <el-button type="success" plain @click="handleBackup" :loading="backingUp">
            UPLOAD (BACKUP)
            </el-button>
            <el-button type="warning" plain @click="handleRestore" :loading="restoring">
            DOWNLOAD (RESTORE)
            </el-button>
        </div>
        <div class="text-xs text-gray-500 mt-2 font-mono truncate">
            STATUS: {{ syncStatus || 'IDLE' }}
        </div>
      </div>

      <!-- About -->
      <div class="border-2 border-black p-4 bg-gray-50">
        <div class="font-bold mb-2">[SYSTEM_INFO]</div>
        <div class="text-xs space-y-1 font-mono">
          <div>VERSION: 1.0.0</div>
          <div>BUILD: DIRECT_CONNECT</div>
          <div>MODE: GEEK_WIRE</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-4">
        <el-button type="primary" class="w-full" @click="saveSettings">
          SAVE_CONFIG
        </el-button>
      </div>

      <div class="text-center">
        <el-button @click="$emit('back')" class="w-full border-0 underline">
          BACK_TO_MAIN
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/logic/storage'
import { GithubService } from '@/logic/github'

const settings = ref({
  githubToken: ''
})

const backingUp = ref(false)
const restoring = ref(false)
const syncStatus = ref('')

onMounted(() => {
  const stored = localStorage.getItem('cp_settings')
  if (stored) {
    try {
      settings.value = JSON.parse(stored)
    } catch (e) {}
  }
})

const saveSettings = () => {
  localStorage.setItem('cp_settings', JSON.stringify(settings.value))
  ElMessage.success('CONFIGURATION_SAVED')
}

const handleBackup = async () => {
    if (!settings.value.githubToken) {
        ElMessage.warning('TOKEN_REQUIRED')
        return
    }
    
    backingUp.value = true
    syncStatus.value = 'CONNECTING_GITHUB...'
    
    try {
        const snippets = await db.snippets.toArray()
        const files = GithubService.prepareGistFiles(snippets)
        
        const existingGist = await GithubService.getGist(settings.value.githubToken)
        
        if (existingGist) {
            syncStatus.value = 'UPDATING_GIST...'
            await GithubService.updateGist(settings.value.githubToken, existingGist.id, files)
        } else {
            syncStatus.value = 'CREATING_GIST...'
            await GithubService.createGist(settings.value.githubToken, files)
        }
        
        syncStatus.value = 'BACKUP_COMPLETE'
        ElMessage.success('BACKUP_SUCCESSFUL')
    } catch (err) {
        console.error(err)
        syncStatus.value = 'ERROR: ' + (err.message || 'UNKNOWN')
        ElMessage.error('BACKUP_FAILED')
    } finally {
        backingUp.value = false
    }
}

const handleRestore = async () => {
    if (!settings.value.githubToken) {
        ElMessage.warning('TOKEN_REQUIRED')
        return
    }

    try {
        await ElMessageBox.confirm('THIS_WILL_OVERWRITE_LOCAL_DATA. CONTINUE?', 'WARNING', {
            confirmButtonText: 'YES_OVERWRITE',
            cancelButtonText: 'CANCEL',
            type: 'warning'
        })
    } catch {
        return
    }

    restoring.value = true
    syncStatus.value = 'CONNECTING_GITHUB...'

    try {
        const existingGist = await GithubService.getGist(settings.value.githubToken)
        
        if (!existingGist) {
            throw new Error('NO_BACKUP_FOUND')
        }

        syncStatus.value = 'DOWNLOADING_DATA...'
        const gistDetail = await GithubService.getGistDetail(settings.value.githubToken, existingGist.id)
        
        const indexFile = gistDetail.files['index.json']
        if (!indexFile) {
            throw new Error('INVALID_BACKUP_FORMAT')
        }

        const indexData = JSON.parse(indexFile.content)
        const newSnippets = []

        for (const meta of indexData) {
            const fileName = `${meta.uuid}.html`
            const contentFile = gistDetail.files[fileName]
            
            newSnippets.push({
                ...meta,
                content: contentFile ? contentFile.content : ''
            })
        }

        syncStatus.value = 'WRITING_DB...'
        
        // Strategy: Clear and Replace to ensure consistency? 
        // Or Merge? Let's use bulkPut (Upsert).
        // But deleted items won't be deleted locally.
        // Let's use Clear + Add for "Mirroring the Backup" if we want exact state.
        // Design Decision: For "Restore", usually means recovering state. Let's Clear and Add.
        
        await db.transaction('rw', db.snippets, async () => {
            await db.snippets.clear()
            await db.snippets.bulkAdd(newSnippets)
        })

        syncStatus.value = 'RESTORE_COMPLETE'
        ElMessage.success('RESTORE_SUCCESSFUL')

    } catch (err) {
        console.error(err)
        syncStatus.value = 'ERROR: ' + (err.message || 'UNKNOWN')
        ElMessage.error('RESTORE_FAILED')
    } finally {
        restoring.value = false
    }
}

defineEmits(['back'])
</script>
