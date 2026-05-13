const OptimizedImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  srcSet,
  sizes,
  width,
  height,
}) => {
  return (
    <picture>
      {srcSet?.map((source, index) => (
        <source key={index} type={source.type} srcSet={source.srcSet} sizes={sizes} />
      ))}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        srcSet={srcSet?.find((s) => s.type === 'image/jpeg')?.srcSet || srcSet?.[0]?.srcSet}
        sizes={sizes}
        width={width}
        height={height}
      />
    </picture>
  );
};

export default OptimizedImage;
