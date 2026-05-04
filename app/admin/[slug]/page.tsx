async function handleScan(url: string) {
  if (cargando) return  // evita llamadas múltiples
  setEscaneando(false)
  setCargando(true)
  setMensaje('')
  setCliente(null)
  setCard(null)

  try {
    const urlObj = new URL(url)
    const clienteId = urlObj.searchParams.get('cliente')

    if (!clienteId) {
      setMensaje('QR no válido')
      setCargando(false)
      return
    }

    const { data: c } = await supabase
      .from('customers')
      .select('*')
      .eq('id', clienteId)
      .single()

    const { data: lc } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('restaurant_id', restaurante.id)
      .eq('customer_id', clienteId)
      .single()

    setCliente(c)
    setCard(lc)
  } catch {
    setMensaje('QR no válido')
  }

  setCargando(false)
}