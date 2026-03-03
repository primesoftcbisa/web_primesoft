-- Database Schema for Primesoft CBISA
-- Timezone: America/Asuncion

-- 1. Empresa
CREATE TABLE empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruc TEXT UNIQUE NOT NULL,
    direccion TEXT,
    telefono TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Usuario (Profiles)
CREATE TYPE user_role AS ENUM ('Admin', 'RTV', 'Cliente');
CREATE TABLE usuario (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    ci TEXT UNIQUE,
    perfil_acceso user_role NOT NULL DEFAULT 'RTV',
    telefono TEXT,
    email TEXT UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Integraciones
CREATE TABLE integraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_google_maps_secret_ref TEXT,
    api_openai_secret_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CBOT
CREATE TABLE cbot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cultura TEXT NOT NULL, -- Soja, Maiz, Trigo
    fecha DATE NOT NULL,
    vencimiento TEXT,
    ctr TEXT,
    cierre NUMERIC(10, 2),
    simulacion NUMERIC(10, 2),
    variacion NUMERIC(10, 2),
    alto NUMERIC(10, 2),
    bajo NUMERIC(10, 2),
    apertura NUMERIC(10, 2),
    costo NUMERIC(10, 2),
    precio_bolsa_simulacion NUMERIC(10, 2),
    precio_bolsa NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cultura, fecha)
);

-- 5. Distribuidor
CREATE TABLE distribuidor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fabricante TEXT NOT NULL,
    distribuidor TEXT NOT NULL,
    estado BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Producto
CREATE TABLE producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    categoria TEXT NOT NULL,
    nombre TEXT NOT NULL,
    fabricante TEXT,
    culturas TEXT[], -- Array of Soja, Maiz, Trigo
    composicion TEXT,
    unidad_medida TEXT NOT NULL, -- Litro, Kg, mL, g
    contenido_empaque NUMERIC(10, 2) NOT NULL,
    precio_compra NUMERIC(10, 2) NOT NULL,
    margen_pct NUMERIC(5, 2) DEFAULT 0,
    costo_operacional_pct NUMERIC(5, 2) DEFAULT 0,
    costo_financiero_pct NUMERIC(5, 2) DEFAULT 0,
    bonificacion_vendedor_pct NUMERIC(5, 2) DEFAULT 0,
    bonificacion_cliente_pct NUMERIC(5, 2) DEFAULT 0,
    voucher_impacto_pct NUMERIC(5, 2) DEFAULT 0,
    precio_minimo NUMERIC(10, 2) NOT NULL,
    precio_venta NUMERIC(10, 2),
    total_en_el_costo NUMERIC(10, 2),
    precio_final NUMERIC(10, 2),
    estado BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Producto Distribuidor (Many-to-Many)
CREATE TABLE producto_distribuidor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES producto(id) ON DELETE CASCADE,
    distribuidor_id UUID REFERENCES distribuidor(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Cliente
CREATE TABLE cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_cliente_id UUID REFERENCES auth.users(id), -- Link to Auth for Cliente profile
    tipo_persona TEXT NOT NULL, -- Fisica, Juridica
    ci TEXT,
    ruc TEXT,
    nombre TEXT NOT NULL,
    fecha_nacimiento DATE,
    estado_civil TEXT,
    telefono TEXT,
    direccion TEXT,
    email TEXT,
    nombre_contador TEXT,
    telefono_contador TEXT,
    fecha_inicio DATE,
    area_propia_ha NUMERIC(10, 2) DEFAULT 0,
    area_alquilada_ha NUMERIC(10, 2) DEFAULT 0,
    vendedor_id UUID REFERENCES auth.users(id),
    archivo_ci_url TEXT,
    estado BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Propuesta
CREATE TABLE propuesta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL, -- Presupuesto, Venta
    cliente_id UUID REFERENCES cliente(id),
    fecha DATE DEFAULT CURRENT_DATE,
    vendedor_id UUID REFERENCES auth.users(id),
    estado TEXT DEFAULT 'Pendiente',
    total_itens INTEGER DEFAULT 0,
    total_voucher NUMERIC(10, 2) DEFAULT 0,
    total_en_bolsas NUMERIC(10, 2) DEFAULT 0,
    total_general NUMERIC(10, 2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Propuesta Item
CREATE TABLE propuesta_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propuesta_id UUID REFERENCES propuesta(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES producto(id),
    distribuidor_id UUID REFERENCES distribuidor(id),
    voucher_percent NUMERIC(5, 2),
    precio_minimo NUMERIC(10, 2),
    precio_producto NUMERIC(10, 2),
    cantidad INTEGER NOT NULL,
    num_aplicaciones INTEGER NOT NULL,
    dosis_ha NUMERIC(10, 2) NOT NULL,
    area_tratada NUMERIC(10, 2),
    costo_ha NUMERIC(10, 2),
    importe_total NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Voucher
CREATE TABLE voucher (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propuesta_id UUID REFERENCES propuesta(id),
    cliente_id UUID REFERENCES cliente(id),
    valor_total NUMERIC(10, 2) NOT NULL,
    estado TEXT DEFAULT 'Generado', -- Generado, Liberado, Cancelado
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Saldo Voucher Cliente
CREATE TABLE saldo_voucher_cliente (
    cliente_id UUID PRIMARY KEY REFERENCES cliente(id),
    saldo_actual_usd NUMERIC(10, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Movimiento Voucher
CREATE TABLE movimiento_voucher (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id),
    tipo TEXT NOT NULL, -- Generado, Liberado, Cancelado
    valor NUMERIC(10, 2) NOT NULL,
    referencia_id UUID, -- ID of propuesta or voucher
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Parcela
CREATE TABLE parcela (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id),
    nombre_parcela TEXT NOT NULL,
    localidad TEXT,
    area_prevista_ha NUMERIC(10, 2),
    area_real_ha NUMERIC(10, 2),
    coordenadas_poligono JSONB,
    estado BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Zafra
CREATE TABLE zafra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_zafra TEXT NOT NULL,
    ciclo TEXT NOT NULL,
    cultura TEXT NOT NULL,
    estado BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Monitoreo
CREATE TABLE monitoreo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id),
    parcela_id UUID REFERENCES parcela(id),
    zafra_id UUID REFERENCES zafra(id),
    etapa TEXT DEFAULT 'Planificación', -- Planificación, Siembra, Aplicaciones, Evaluaciones, Cosecha, RTE, Concluido
    costo_estimado_usd NUMERIC(10, 2),
    productividad_estimada_kg_ha NUMERIC(10, 2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Siembra
CREATE TABLE siembra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoreo_id UUID REFERENCES monitoreo(id) ON DELETE CASCADE,
    fecha_inicio_siembra DATE,
    fecha_termino_siembra DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Siembra Item
CREATE TABLE siembra_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siembra_id UUID REFERENCES siembra(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES producto(id),
    precio_unitario NUMERIC(10, 2),
    dosis_ha NUMERIC(10, 2),
    cantidad NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Aplicacion
CREATE TABLE aplicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoreo_id UUID REFERENCES monitoreo(id) ON DELETE CASCADE,
    fecha_aplicacion DATE,
    tipo TEXT, -- Terrestre, Aérea
    rendimiento_tanque_ha NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. Aplicacion Item
CREATE TABLE aplicacion_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aplicacion_id UUID REFERENCES aplicacion(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES producto(id),
    precio_unitario NUMERIC(10, 2),
    dosis_ha NUMERIC(10, 2),
    cantidad NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. Evaluacion
CREATE TABLE evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoreo_id UUID REFERENCES monitoreo(id) ON DELETE CASCADE,
    fecha_evaluacion DATE,
    etapa_fenologica TEXT,
    vigor TEXT,
    plagas TEXT,
    enfermedades TEXT,
    malezas TEXT,
    estres_hidrico TEXT,
    fitotoxicidad TEXT,
    clima_reciente TEXT,
    img1_url TEXT,
    img2_url TEXT,
    img3_url TEXT,
    descripcion_general TEXT,
    fecha_proxima_evaluacion DATE,
    fecha_proxima_visita DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 22. Cosecha
CREATE TABLE cosecha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoreo_id UUID REFERENCES monitoreo(id) ON DELETE CASCADE,
    fecha_inicio_cosecha DATE,
    fecha_termino_cosecha DATE,
    resultado_liquido_kg NUMERIC(10, 2),
    productividad_bolsas_alq NUMERIC(10, 2),
    humedad NUMERIC(5, 2),
    costo_bolsa NUMERIC(10, 2),
    costo_total NUMERIC(10, 2),
    destino TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 23. RTE (Relatório Técnico Econômico)
CREATE TABLE rte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoreo_id UUID REFERENCES monitoreo(id) ON DELETE CASCADE,
    costo_total NUMERIC(10, 2),
    ingreso_total NUMERIC(10, 2),
    resultado_tecnico NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 24. Chat
CREATE TABLE chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id),
    titulo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 25. Mensaje
CREATE TABLE mensaje (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chat(id) ON DELETE CASCADE,
    remitente TEXT, -- Usuario, IA
    contenido TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES

-- Enable RLS on all tables
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE integraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbot ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuidor ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_distribuidor ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuesta_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE saldo_voucher_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_voucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE zafra ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoreo ENABLE ROW LEVEL SECURITY;
ALTER TABLE siembra ENABLE ROW LEVEL SECURITY;
ALTER TABLE siembra_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE aplicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE aplicacion_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosecha ENABLE ROW LEVEL SECURITY;
ALTER TABLE rte ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensaje ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is Admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuario 
        WHERE id = auth.uid() AND perfil_acceso = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Full Access
CREATE POLICY admin_all ON empresa FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON usuario FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON integraciones FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON cbot FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON distribuidor FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON producto FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON producto_distribuidor FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON cliente FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON propuesta FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON propuesta_item FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON voucher FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON saldo_voucher_cliente FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON movimiento_voucher FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON parcela FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON zafra FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON monitoreo FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON siembra FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON siembra_item FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON aplicacion FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON aplicacion_item FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON evaluacion FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON cosecha FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON rte FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON chat FOR ALL TO authenticated USING (is_admin());
CREATE POLICY admin_all ON mensaje FOR ALL TO authenticated USING (is_admin());

-- RTV Policies
CREATE POLICY rtv_read_all_products ON producto FOR SELECT TO authenticated USING (true);
CREATE POLICY rtv_read_all_clients ON cliente FOR SELECT TO authenticated USING (true);
CREATE POLICY rtv_write_own_clients ON cliente FOR ALL TO authenticated USING (created_by = auth.uid());
CREATE POLICY rtv_write_own_proposals ON propuesta FOR ALL TO authenticated USING (created_by = auth.uid());
CREATE POLICY rtv_write_own_monitoreo ON monitoreo FOR ALL TO authenticated USING (created_by = auth.uid());
-- (Add more RTV policies as needed following the "created_by = auth.uid()" rule)

-- Cliente Policies
CREATE POLICY cliente_read_own ON cliente FOR SELECT TO authenticated USING (usuario_cliente_id = auth.uid());
CREATE POLICY cliente_read_own_proposals ON propuesta FOR SELECT TO authenticated USING (cliente_id IN (SELECT id FROM cliente WHERE usuario_cliente_id = auth.uid()));
CREATE POLICY cliente_read_own_monitoreo ON monitoreo FOR SELECT TO authenticated USING (cliente_id IN (SELECT id FROM cliente WHERE usuario_cliente_id = auth.uid()));
