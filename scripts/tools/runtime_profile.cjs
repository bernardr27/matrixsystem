function normalize(v) {
    return String(v || '').trim().toLowerCase();
}

function resolveRuntimeProfile(env = process.env) {
    const mode = normalize(env.MATRIX_MODE);
    const cloud = normalize(env.MATRIX_CLOUD_MODE);
    const profileName = normalize(env.MATRIX_PROFILE);

    if (profileName === 'cloud-prod') {
        return { name: 'cloud-prod', production: true, cloud: true, strictSchemaDefault: true };
    }
    if (profileName === 'local-prod') {
        return { name: 'local-prod', production: true, cloud: false, strictSchemaDefault: false };
    }
    if (profileName === 'dev') {
        return { name: 'dev', production: false, cloud: false, strictSchemaDefault: false };
    }

    const production = mode === 'production';
    const isCloud = cloud === 'true' || cloud === '1';
    return {
        name: production ? (isCloud ? 'cloud-prod' : 'local-prod') : 'dev',
        production,
        cloud: isCloud,
        strictSchemaDefault: production && isCloud
    };
}

module.exports = { resolveRuntimeProfile };
