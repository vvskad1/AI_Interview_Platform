"""
Startup configuration to ensure sentence transformers works properly
This should be imported early in the application startup
"""
import os
import ssl
import logging

logger = logging.getLogger(__name__)

def configure_ssl_for_sentence_transformers():
    """Configure SSL settings to fix sentence transformers download issues"""
    
    # Clear problematic SSL environment variables that interfere with model downloading
    ssl_vars_to_clear = [
        'REQUESTS_CA_BUNDLE',
        'CURL_CA_BUNDLE', 
        'SSL_CERT_FILE',
        'SSL_CERT_DIR'
    ]
    
    cleared_vars = []
    for var in ssl_vars_to_clear:
        if var in os.environ:
            cleared_vars.append(f"{var}={os.environ[var]}")
            del os.environ[var]
    
    if cleared_vars:
        logger.info(f"🔧 Cleared SSL environment variables: {', '.join(cleared_vars)}")
    
    # Set cache directory for models
    cache_dir = os.path.expanduser('~/.cache/huggingface')
    os.makedirs(cache_dir, exist_ok=True)
    
    os.environ['HF_HOME'] = cache_dir
    os.environ['TRANSFORMERS_CACHE'] = cache_dir
    
    logger.info(f"📁 HuggingFace cache directory set to: {cache_dir}")
    
    # Disable symlink warnings on Windows
    os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
    
    logger.info("✅ SSL and cache configuration completed for sentence transformers")

# Apply configuration when imported
configure_ssl_for_sentence_transformers()