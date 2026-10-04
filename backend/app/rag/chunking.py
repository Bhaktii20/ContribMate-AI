from typing import List, Dict, Any

class DocumentChunker:
    @staticmethod
    def chunk_text(text: str, file_path: str, repo_full_name: str, chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
        if not text:
            return []
            
        lines = text.split("\n")
        chunks = []
        current_chunk_lines = []
        current_length = 0
        chunk_index = 0
        
        for line in lines:
            current_chunk_lines.append(line)
            current_length += len(line) + 1
            
            if current_length >= chunk_size:
                chunk_content = "\n".join(current_chunk_lines)
                chunks.append({
                    "chunk_id": f"{file_path}_chunk_{chunk_index}",
                    "repo_full_name": repo_full_name,
                    "file_path": file_path,
                    "content": chunk_content,
                    "chunk_index": chunk_index
                })
                chunk_index += 1
                
                # keep overlap lines
                overlap_lines = []
                overlap_len = 0
                for prev_line in reversed(current_chunk_lines):
                    if overlap_len + len(prev_line) <= overlap:
                        overlap_lines.insert(0, prev_line)
                        overlap_len += len(prev_line) + 1
                    else:
                        break
                current_chunk_lines = overlap_lines
                current_length = overlap_len

        if current_chunk_lines:
            chunk_content = "\n".join(current_chunk_lines)
            chunks.append({
                "chunk_id": f"{file_path}_chunk_{chunk_index}",
                "repo_full_name": repo_full_name,
                "file_path": file_path,
                "content": chunk_content,
                "chunk_index": chunk_index
            })

        return chunks
